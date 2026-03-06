import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Assessment } from "@/lib/models/assessment";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    await connectDB();

    const assessment = await Assessment.findOne({ accessCode: code, status: "finalized" }).lean();
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    return NextResponse.json({
      jobTitle: assessment.jobTitle,
      domain: assessment.domain,
      seniority: assessment.seniority,
      questionCount: assessment.questions.length,
      timeLimit: assessment.timeLimit,
    });
  } catch (error) {
    console.error("Failed to fetch test info:", error);
    return NextResponse.json({ error: "Failed to fetch test info" }, { status: 500 });
  }
}
