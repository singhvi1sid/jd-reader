import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Submission } from "@/lib/models/submission";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const submission = await Submission.findById(id).lean();
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: submission._id!.toString(),
      assessmentId: submission.assessmentId.toString(),
      candidateName: submission.candidateName,
      candidateEmail: submission.candidateEmail,
      answers: submission.answers,
      startedAt: submission.startedAt,
      submittedAt: submission.submittedAt,
      status: submission.status,
      scores: submission.scores,
      totalScore: submission.totalScore,
      aiRecommendation: submission.aiRecommendation,
      aiSummary: submission.aiSummary,
      recruiterOverride: submission.recruiterOverride,
    });
  } catch (error) {
    console.error("Failed to fetch submission:", error);
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Save answers (auto-save or final submit)
    if (body.answers && Array.isArray(body.answers)) {
      submission.answers = body.answers;
    }

    // Final submission
    if (body.submit === true) {
      if (submission.status !== "in_progress") {
        return NextResponse.json({ error: "Test already submitted" }, { status: 400 });
      }
      submission.status = "submitted";
      submission.submittedAt = new Date();
    }

    // Recruiter override
    if (body.recruiterOverride) {
      submission.recruiterOverride = body.recruiterOverride;
    }

    await submission.save();

    return NextResponse.json({
      id: submission._id.toString(),
      status: submission.status,
      submittedAt: submission.submittedAt,
    });
  } catch (error) {
    console.error("Failed to update submission:", error);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}
