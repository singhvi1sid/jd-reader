import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Submission } from "@/lib/models/submission";
import { Assessment } from "@/lib/models/assessment";
import { geminiFlash } from "@/lib/gemini";
import { getScoringPrompt } from "@/lib/prompts";
import { scoringResponseSchema } from "@/lib/schemas";

const TYPE_WEIGHTS: Record<string, number> = {
  MCQ: 1,
  SHORT_ANSWER: 1.5,
  SCENARIO: 2,
  MINI_TASK: 2,
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.status === "scored") {
      return NextResponse.json({
        id: submission._id.toString(),
        status: "scored",
        totalScore: submission.totalScore,
        aiRecommendation: submission.aiRecommendation,
        message: "Already scored",
      });
    }

    if (submission.status !== "submitted") {
      return NextResponse.json({ error: "Test must be submitted before scoring" }, { status: 400 });
    }

    const assessment = await Assessment.findById(submission.assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const questions = assessment.questions.map((q: { order: number; type: string; content: string; options?: string[]; expectedAnswer?: string; difficulty: string; skillTested: string }) => ({
      order: q.order,
      type: q.type,
      content: q.content,
      options: q.options,
      expectedAnswer: q.expectedAnswer,
      difficulty: q.difficulty,
      skillTested: q.skillTested,
    }));

    const result = await geminiFlash.generateContent(
      getScoringPrompt({
        jobTitle: assessment.jobTitle,
        seniority: assessment.seniority,
        domain: assessment.domain,
        scoringThresholds: assessment.scoringThresholds,
        questions,
        answers: submission.answers.map((a: { questionOrder: number; answer: string }) => ({
          questionOrder: a.questionOrder,
          answer: a.answer,
        })),
      })
    );

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);
    const scoring = scoringResponseSchema.parse(parsed);

    // Calculate weighted total score
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const score of scoring.scores) {
      const question = questions.find((q: { order: number }) => q.order === score.questionOrder);
      const weight = question ? (TYPE_WEIGHTS[question.type] || 1) : 1;
      totalWeightedScore += (score.score / 10) * weight;
      totalWeight += weight;
    }

    const totalScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) : 0;

    submission.scores = scoring.scores;
    submission.totalScore = totalScore;
    submission.aiRecommendation = scoring.recommendation;
    submission.aiSummary = scoring.overallSummary;
    submission.status = "scored";
    await submission.save();

    return NextResponse.json({
      id: submission._id.toString(),
      status: "scored",
      totalScore,
      aiRecommendation: scoring.recommendation,
      aiSummary: scoring.overallSummary,
      scores: scoring.scores,
    });
  } catch (error) {
    console.error("Scoring failed:", error);
    return NextResponse.json({ error: "Failed to score submission" }, { status: 500 });
  }
}
