import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Assessment } from "@/lib/models/assessment";
import { geminiFlash } from "@/lib/gemini";
import { getRegeneratePrompt } from "@/lib/prompts";
import { regeneratedQuestionSchema } from "@/lib/schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { questionOrder, feedback } = await request.json();

    if (!questionOrder || !feedback) {
      return NextResponse.json(
        { error: "questionOrder and feedback are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const questionIdx = assessment.questions.findIndex(
      (q: { order: number }) => q.order === questionOrder
    );
    if (questionIdx === -1) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const originalQuestion = assessment.questions[questionIdx];

    const result = await geminiFlash.generateContent(
      getRegeneratePrompt({
        jobTitle: assessment.jobTitle,
        seniority: assessment.seniority,
        domain: assessment.domain,
        skills: assessment.skills,
        originalQuestion: {
          type: originalQuestion.type,
          content: originalQuestion.content,
          options: originalQuestion.options,
          expectedAnswer: originalQuestion.expectedAnswer,
          difficulty: originalQuestion.difficulty,
          skillTested: originalQuestion.skillTested,
        },
        feedback,
      })
    );

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);
    const newQuestion = regeneratedQuestionSchema.parse(parsed);

    assessment.questions[questionIdx] = {
      ...assessment.questions[questionIdx],
      type: newQuestion.type,
      content: newQuestion.content,
      options: newQuestion.options,
      expectedAnswer: newQuestion.expectedAnswer,
      difficulty: newQuestion.difficulty,
      skillTested: newQuestion.skillTested,
      reviewStatus: "pending",
    };

    await assessment.save();

    return NextResponse.json({
      question: assessment.questions[questionIdx],
    });
  } catch (error) {
    console.error("Regeneration failed:", error);
    return NextResponse.json({ error: "Failed to regenerate question" }, { status: 500 });
  }
}
