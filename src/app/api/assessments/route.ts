import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Assessment } from "@/lib/models/assessment";
import { geminiFlashLite, geminiFlash } from "@/lib/gemini";
import { JD_ANALYSIS_PROMPT, getAssessmentPrompt, getSimilarityCheckPrompt } from "@/lib/prompts";
import { jdAnalysisSchema, assessmentResponseSchema, similarityResponseSchema } from "@/lib/schemas";
import { auth } from "@/lib/auth";

export const maxDuration = 55;

function parseModelJson<T>(rawText: string, stage: string): T {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `AI returned invalid ${stage} response. Please retry generation once.`
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    const recruiterId = (session?.user as { id?: string })?.id;

    await connectDB();

    const filter = recruiterId ? { recruiterId } : {};
    const assessments = await Assessment.find(filter)
      .sort({ createdAt: -1 })
      .select("jobTitle seniority domain status accessCode timeLimit questions createdAt")
      .lean();

    const list = assessments.map((a) => ({
      id: a._id!.toString(),
      jobTitle: a.jobTitle,
      seniority: a.seniority,
      domain: a.domain,
      status: a.status,
      accessCode: a.accessCode,
      timeLimit: a.timeLimit,
      questionCount: a.questions?.length ?? 0,
      createdAt: a.createdAt,
    }));

    return NextResponse.json(list);
  } catch (error) {
    console.error("Failed to fetch assessments:", error);
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await auth();
    const recruiterId = (session?.user as { id?: string })?.id;

    const { jobDescription } = await request.json();

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide a job description with at least 50 characters." },
        { status: 400 }
      );
    }

    const dbPromise = connectDB();

    // Phase 1: Analyze JD
    const analysisResult = await geminiFlashLite.generateContent(
      JD_ANALYSIS_PROMPT + jobDescription
    );
    const analysisText = analysisResult.response.text();
    const rawAnalysis = parseModelJson<unknown>(analysisText, "JD analysis");
    const analysis = jdAnalysisSchema.parse(rawAnalysis);

    await dbPromise;

    // Phase 1.5: Check for similar existing assessments
    let reusableContext: Parameters<typeof getAssessmentPrompt>[1] = undefined;

    if (recruiterId) {
      try {
        const similar = await Assessment.find({
          recruiterId,
          domain: { $regex: new RegExp(analysis.domain.split(/\s+/)[0], "i") },
          status: "finalized",
        })
          .sort({ createdAt: -1 })
          .limit(3)
          .select("jobTitle questions")
          .lean();

        if (similar.length > 0) {
          const best = similar[0];
          interface ExistingQuestion {
            order: number;
            type: string;
            content: string;
            options?: string[];
            expectedAnswer?: string;
            difficulty: string;
            skillTested: string;
          }
          const existingQuestions: ExistingQuestion[] = (best.questions || []).map((q: Record<string, unknown>) => ({
            order: q.order as number,
            type: q.type as string,
            content: q.content as string,
            options: q.options as string[] | undefined,
            expectedAnswer: q.expectedAnswer as string | undefined,
            difficulty: q.difficulty as string,
            skillTested: q.skillTested as string,
          }));

          if (existingQuestions.length > 0) {
            const simResult = await geminiFlashLite.generateContent(
              getSimilarityCheckPrompt({
                newRole: {
                  jobTitle: analysis.jobTitle,
                  seniority: analysis.seniority,
                  domain: analysis.domain,
                  skills: analysis.skills,
                },
                existingQuestions,
                existingJobTitle: best.jobTitle,
              })
            );
            const simText = simResult.response.text();
            const simData = similarityResponseSchema.parse(
              parseModelJson<unknown>(simText, "similarity check")
            );

            if (simData.similarityScore >= 50 && simData.reusableQuestions.length > 0) {
              reusableContext = {
                questions: simData.reusableQuestions
                  .map((rq) => {
                    const orig = existingQuestions.find((q) => q.order === rq.originalOrder);
                    if (!orig) return null;
                    return {
                      type: orig.type,
                      content: orig.content,
                      options: orig.options,
                      expectedAnswer: orig.expectedAnswer,
                      difficulty: orig.difficulty,
                      skillTested: orig.skillTested,
                      action: rq.action,
                      modificationNote: rq.modificationNote,
                    };
                  })
                  .filter(Boolean) as NonNullable<typeof reusableContext>["questions"],
              };
            }
          }
        }
      } catch (simErr) {
        console.warn("Similarity check failed, generating fresh:", simErr);
      }
    }

    // Phase 2: Generate questions (with optional reusable context)
    const assessmentResult = await geminiFlash.generateContent(
      getAssessmentPrompt(analysis, reusableContext)
    );
    const assessmentText = assessmentResult.response.text();
    const rawAssessment = parseModelJson<unknown>(
      assessmentText,
      "assessment generation"
    );
    const assessmentData = assessmentResponseSchema.parse(rawAssessment);

    const assessment = await Assessment.create({
      jobTitle: analysis.jobTitle,
      companyName: analysis.companyName || "",
      seniority: analysis.seniority,
      domain: analysis.domain,
      skills: analysis.skills,
      niceToHaveSkills: analysis.niceToHaveSkills,
      keyResponsibilities: analysis.keyResponsibilities,
      rawJobDescription: jobDescription,
      questions: assessmentData.questions,
      recruiterId,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      id: assessment._id.toString(),
      jobTitle: assessment.jobTitle,
      seniority: assessment.seniority,
      domain: assessment.domain,
      skills: assessment.skills,
      niceToHaveSkills: assessment.niceToHaveSkills,
      keyResponsibilities: assessment.keyResponsibilities,
      questions: assessment.questions,
      generatedInSeconds: elapsed,
    });
  } catch (error) {
    console.error("Assessment generation failed:", error);
    const message = error instanceof Error ? error.message : "Failed to generate assessment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
