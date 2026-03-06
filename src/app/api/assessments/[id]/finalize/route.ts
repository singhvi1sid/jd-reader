import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Assessment } from "@/lib/models/assessment";
import crypto from "crypto";

function generateAccessCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (assessment.status === "finalized") {
      return NextResponse.json({
        id: assessment._id.toString(),
        accessCode: assessment.accessCode,
        status: "finalized",
      });
    }

    const hasPending = assessment.questions.some(
      (q: { reviewStatus: string }) => q.reviewStatus === "pending"
    );
    if (hasPending) {
      return NextResponse.json(
        { error: "All questions must be approved or rejected before finalizing" },
        { status: 400 }
      );
    }

    // Remove rejected questions and re-order
    assessment.questions = assessment.questions
      .filter((q: { reviewStatus: string }) => q.reviewStatus === "approved")
      .map((q: Record<string, unknown>, idx: number) => {
        const plain = typeof (q as { toObject?: () => Record<string, unknown> }).toObject === "function"
          ? (q as { toObject: () => Record<string, unknown> }).toObject()
          : q;
        return { ...plain, order: idx + 1 };
      });

    if (assessment.questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question must be approved" },
        { status: 400 }
      );
    }

    // Generate unique access code
    let accessCode = generateAccessCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await Assessment.findOne({ accessCode });
      if (!existing) break;
      accessCode = generateAccessCode();
      attempts++;
    }

    assessment.accessCode = accessCode;
    assessment.status = "finalized";
    await assessment.save();

    return NextResponse.json({
      id: assessment._id.toString(),
      accessCode: assessment.accessCode,
      status: "finalized",
      questionCount: assessment.questions.length,
      timeLimit: assessment.timeLimit,
    });
  } catch (error) {
    console.error("Finalization failed:", error);
    return NextResponse.json({ error: "Failed to finalize assessment" }, { status: 500 });
  }
}
