"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReviewQuestionCard } from "@/components/review-question-card";
import { ShareDialog } from "@/components/share-dialog";
import {
  BarChart3, Globe, Briefcase,
  CheckCircle2, XCircle, Clock, Loader2, Link2, Trophy,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface Question {
  type: "MCQ" | "SHORT_ANSWER" | "SCENARIO" | "MINI_TASK";
  content: string;
  options?: string[];
  expectedAnswer?: string;
  difficulty: "easy" | "medium" | "hard";
  skillTested: string;
  order: number;
  reviewStatus: "pending" | "approved" | "rejected";
}

interface ScoringThresholds {
  strongHire: number;
  hire: number;
  maybe: number;
  reject: number;
}

interface AssessmentData {
  id: string;
  jobTitle: string;
  companyName?: string;
  seniority: string;
  domain: string;
  skills: string[];
  niceToHaveSkills: string[];
  keyResponsibilities: string[];
  questions: Question[];
  status: string;
  timeLimit: number;
  accessCode?: string;
  scoringThresholds: ScoringThresholds;
}

const seniorityColors: Record<string, string> = {
  junior: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  mid: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  senior: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  lead: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const TIME_OPTIONS = [30, 45, 60, 90, 120];

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const fetchAssessment = useCallback(async () => {
    const res = await fetch(`/api/assessments/${id}`);
    if (res.ok) {
      const data = await res.json();
      setAssessment(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAssessment(); }, [fetchAssessment]);

  const updateReview = async (order: number, reviewStatus: string) => {
    if (!assessment) return;
    setSaving(true);
    const res = await fetch(`/api/assessments/${id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionUpdates: [{ order, reviewStatus }] }),
    });
    if (res.ok) {
      const data = await res.json();
      setAssessment((prev) => prev ? { ...prev, questions: data.questions } : null);
    }
    setSaving(false);
  };

  const handleApprove = (order: number) => updateReview(order, "approved");
  const handleReject = (order: number) => updateReview(order, "rejected");

  const handleRegenerate = async (order: number, feedback: string) => {
    const res = await fetch(`/api/assessments/${id}/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionOrder: order, feedback }),
    });
    if (res.ok) {
      const data = await res.json();
      setAssessment((prev) => {
        if (!prev) return null;
        const updated = prev.questions.map((q) =>
          q.order === order ? { ...data.question } : q
        );
        return { ...prev, questions: updated };
      });
    }
  };

  const handleTimeChange = async (timeLimit: number) => {
    if (!assessment) return;
    setAssessment((prev) => prev ? { ...prev, timeLimit } : null);
    await fetch(`/api/assessments/${id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeLimit }),
    });
  };

  const handleThresholdChange = async (field: keyof ScoringThresholds, value: number) => {
    if (!assessment) return;
    const updated = { ...assessment.scoringThresholds, [field]: value };
    setAssessment((prev) => prev ? { ...prev, scoringThresholds: updated } : null);
    await fetch(`/api/assessments/${id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoringThresholds: updated }),
    });
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    const res = await fetch(`/api/assessments/${id}/finalize`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setAssessment((prev) => prev ? { ...prev, status: "finalized", accessCode: data.accessCode } : null);
      setShowShareModal(true);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to finalize");
    }
    setFinalizing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!assessment) {
    return <div className="flex items-center justify-center min-h-[60vh] text-zinc-400">Assessment not found</div>;
  }

  const approved = assessment.questions.filter((q) => q.reviewStatus === "approved").length;
  const rejected = assessment.questions.filter((q) => q.reviewStatus === "rejected").length;
  const pending = assessment.questions.filter((q) => q.reviewStatus === "pending").length;
  const canFinalize = pending === 0 && approved > 0;
  const isFinalized = assessment.status === "finalized";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Role header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              {assessment.jobTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide", seniorityColors[assessment.seniority] || seniorityColors.mid)}>
                <BarChart3 className="h-3 w-3" />{assessment.seniority}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-800/80 px-3 py-1 text-xs font-medium text-zinc-300">
                <Globe className="h-3 w-3 text-zinc-500" />{assessment.domain}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-800/80 px-3 py-1 text-xs font-medium text-zinc-300">
                <Briefcase className="h-3 w-3 text-zinc-500" />{assessment.questions.length} questions
              </span>
            </div>
          </div>
          {isFinalized && (
            <button
              onClick={() => router.push(`/assessment/${id}/leaderboard`)}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
            >
              <Trophy className="h-4 w-4" /> Leaderboard
            </button>
          )}
        </div>

        {/* Skills */}
        <div className="space-y-2 mb-6">
          <div className="flex flex-wrap gap-1.5">
            {assessment.skills.map((s) => (
              <span key={s} className="rounded-md bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-300">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Review status bar + time limit */}
      <div className="mb-8 rounded-xl border border-white/10 bg-zinc-900/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">{approved}</span>
              <span className="text-zinc-500">approved</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 font-medium">{rejected}</span>
              <span className="text-zinc-500">rejected</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-zinc-400" />
              <span className="text-zinc-300 font-medium">{pending}</span>
              <span className="text-zinc-500">pending</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <Clock className="h-4 w-4" /> Time limit:
              <select
                value={assessment.timeLimit}
                onChange={(e) => handleTimeChange(Number(e.target.value))}
                disabled={isFinalized}
                className="rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t} min</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Scoring Thresholds */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3">Scoring Thresholds (% score)</p>
          <div className="grid grid-cols-4 gap-3">
            {([
              { key: "strongHire" as const, label: "Strong Hire", color: "text-emerald-400 border-emerald-500/30 focus:border-emerald-500/50", fallback: 80 },
              { key: "hire" as const, label: "Hire", color: "text-blue-400 border-blue-500/30 focus:border-blue-500/50", fallback: 60 },
              { key: "maybe" as const, label: "Maybe", color: "text-amber-400 border-amber-500/30 focus:border-amber-500/50", fallback: 40 },
              { key: "reject" as const, label: "Reject", color: "text-red-400 border-red-500/30 focus:border-red-500/50", fallback: 20 },
            ]).map(({ key, label, color, fallback }) => (
              <label key={key} className="space-y-1">
                <span className={cn("text-xs font-medium", color.split(" ")[0])}>{label} {key === "reject" ? "<" : "\u2265"}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={assessment.scoringThresholds?.[key] ?? fallback}
                  onChange={(e) => handleThresholdChange(key, Number(e.target.value))}
                  disabled={isFinalized}
                  className={cn("w-full rounded-lg border bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none", color.split(" ").slice(1).join(" "))}
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-2">Candidates scoring below the Reject threshold are auto-rejected</p>
        </div>

        {!isFinalized && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {canFinalize ? "All questions reviewed. Ready to finalize." : `Review all ${pending} remaining question${pending !== 1 ? "s" : ""} to finalize.`}
            </p>
            <button
              onClick={handleFinalize}
              disabled={!canFinalize || finalizing}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all",
                canFinalize && !finalizing
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 hover:brightness-110"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              )}
            >
              {finalizing ? <><Loader2 className="h-4 w-4 animate-spin" /> Finalizing...</> : "Finalize Assessment"}
            </button>
          </div>
        )}

        {isFinalized && assessment.accessCode && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">FINALIZED</span>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
              >
                <Link2 className="h-4 w-4" /> Share Test Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {assessment.questions.map((q) => (
          <ReviewQuestionCard
            key={q.order}
            question={q}
            onApprove={handleApprove}
            onReject={handleReject}
            onRegenerate={handleRegenerate}
          />
        ))}
      </div>

      {/* Share modal */}
      {showShareModal && assessment.accessCode && (
        <ShareDialog
          assessmentId={id}
          accessCode={assessment.accessCode}
          jobTitle={assessment.jobTitle}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
