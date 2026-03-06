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

    // Strip expected answers — candidates should NOT see them
    const questions = assessment.questions.map((q: {
      type: string; content: string; options?: string[];
      difficulty: string; skillTested: string; order: number;
    }) => ({
      type: q.type,
      content: q.content,
      options: q.options,
      difficulty: q.difficulty,
      skillTested: q.skillTested,
      order: q.order,
    }));

    return NextResponse.json({
      jobTitle: assessment.jobTitle,
      timeLimit: assessment.timeLimit,
      questions,
    });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
