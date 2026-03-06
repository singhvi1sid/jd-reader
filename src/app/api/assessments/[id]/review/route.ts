import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Assessment } from "@/lib/models/assessment";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (assessment.status === "finalized") {
      return NextResponse.json({ error: "Assessment is already finalized" }, { status: 400 });
    }

    // Update question review statuses
    if (body.questionUpdates && Array.isArray(body.questionUpdates)) {
      for (const update of body.questionUpdates) {
        const question = assessment.questions.find(
          (q: { order: number }) => q.order === update.order
        );
        if (question) {
          question.reviewStatus = update.reviewStatus;
        }
      }
    }

    // Update time limit
    if (body.timeLimit && typeof body.timeLimit === "number") {
      assessment.timeLimit = body.timeLimit;
    }

    // Update scoring thresholds
    if (body.scoringThresholds) {
      const { strongHire, hire, maybe, reject } = body.scoringThresholds;
      if (typeof strongHire === "number") assessment.scoringThresholds.strongHire = strongHire;
      if (typeof hire === "number") assessment.scoringThresholds.hire = hire;
      if (typeof maybe === "number") assessment.scoringThresholds.maybe = maybe;
      if (typeof reject === "number") assessment.scoringThresholds.reject = reject;
    }

    await assessment.save();

    return NextResponse.json({
      id: assessment._id.toString(),
      questions: assessment.questions,
      timeLimit: assessment.timeLimit,
      status: assessment.status,
    });
  } catch (error) {
    console.error("Review update failed:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
