import { AssessmentView } from "@/components/assessment-view";
import { notFound } from "next/navigation";

interface AssessmentPageProps {
  params: Promise<{ id: string }>;
}

async function getAssessment(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/assessments/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function AssessmentPage({ params }: AssessmentPageProps) {
  const { id } = await params;
  const assessment = await getAssessment(id);

  if (!assessment) {
    notFound();
  }

  return <AssessmentView assessment={assessment} />;
}
