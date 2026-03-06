import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Assessment } from "@/lib/models/assessment";
import { Submission } from "@/lib/models/submission";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const assessment = await Assessment.findById(id).lean();
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const submissions = await Submission.find({
      assessmentId: id,
      status: { $in: ["submitted", "scored"] },
    })
      .sort({ totalScore: -1, submittedAt: 1 })
      .lean();

    const candidates = submissions.map((s, idx) => ({
      id: s._id!.toString(),
      rank: idx + 1,
      candidateName: s.candidateName,
      candidateEmail: s.candidateEmail,
      totalScore: s.totalScore ?? null,
      aiRecommendation: s.aiRecommendation ?? null,
      aiSummary: s.aiSummary ?? null,
      status: s.status,
      startedAt: s.startedAt,
      submittedAt: s.submittedAt,
      timeTaken: s.submittedAt && s.startedAt
        ? Math.round((new Date(s.submittedAt).getTime() - new Date(s.startedAt).getTime()) / 60000)
        : null,
      recruiterOverride: s.recruiterOverride ?? null,
    }));

    const scoredCandidates = candidates.filter((c) => c.totalScore !== null);
    const avgScore = scoredCandidates.length > 0
      ? Math.round(scoredCandidates.reduce((sum, c) => sum + (c.totalScore ?? 0), 0) / scoredCandidates.length)
      : null;

    return NextResponse.json({
      assessment: {
        id: assessment._id!.toString(),
        jobTitle: assessment.jobTitle,
        seniority: assessment.seniority,
        domain: assessment.domain,
        questionCount: assessment.questions.length,
        timeLimit: assessment.timeLimit,
      },
      candidates,
      stats: {
        totalCandidates: candidates.length,
        scoredCandidates: scoredCandidates.length,
        averageScore: avgScore,
      },
    });
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
