import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Assessment } from "@/lib/models/assessment";

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

    return NextResponse.json({
      id: assessment._id!.toString(),
      jobTitle: assessment.jobTitle,
      companyName: assessment.companyName || "",
      seniority: assessment.seniority,
      domain: assessment.domain,
      skills: assessment.skills,
      niceToHaveSkills: assessment.niceToHaveSkills,
      keyResponsibilities: assessment.keyResponsibilities,
      questions: assessment.questions,
      status: assessment.status,
      accessCode: assessment.accessCode,
      timeLimit: assessment.timeLimit,
      scoringThresholds: assessment.scoringThresholds || { strongHire: 80, hire: 60, maybe: 40, reject: 20 },
      createdAt: assessment.createdAt,
    });
  } catch (error) {
    console.error("Failed to fetch assessment:", error);
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
  }
}
