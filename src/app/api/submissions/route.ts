import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Assessment } from "@/lib/models/assessment";
import { Submission } from "@/lib/models/submission";

export async function POST(request: NextRequest) {
  try {
    const { accessCode, candidateName, candidateEmail } = await request.json();

    if (!accessCode || !candidateName || !candidateEmail) {
      return NextResponse.json(
        { error: "accessCode, candidateName, and candidateEmail are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const assessment = await Assessment.findOne({ accessCode, status: "finalized" });
    if (!assessment) {
      return NextResponse.json(
        { error: "Invalid access code or assessment not available" },
        { status: 404 }
      );
    }

    // Check if candidate already started a test
    const existing = await Submission.findOne({
      assessmentId: assessment._id,
      candidateEmail,
      status: { $in: ["in_progress", "submitted", "scored"] },
    });

    if (existing) {
      if (existing.status === "in_progress") {
        return NextResponse.json({
          id: existing._id.toString(),
          assessmentId: assessment._id.toString(),
          status: "in_progress",
          message: "Resuming existing test",
        });
      }
      return NextResponse.json(
        { error: "You have already submitted this assessment" },
        { status: 400 }
      );
    }

    const submission = await Submission.create({
      assessmentId: assessment._id,
      candidateName,
      candidateEmail,
      startedAt: new Date(),
      status: "in_progress",
      answers: [],
    });

    return NextResponse.json({
      id: submission._id.toString(),
      assessmentId: assessment._id.toString(),
      status: "in_progress",
    });
  } catch (error) {
    console.error("Failed to create submission:", error);
    return NextResponse.json({ error: "Failed to start test" }, { status: 500 });
  }
}
