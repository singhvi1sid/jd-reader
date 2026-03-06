"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy, Users, BarChart3, Clock, Loader2,
  ChevronRight, ArrowLeft, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface Candidate {
  id: string;
  rank: number;
  candidateName: string;
  candidateEmail: string;
  totalScore: number | null;
  aiRecommendation: string | null;
  aiSummary: string | null;
  status: string;
  timeTaken: number | null;
  submittedAt: string | null;
  recruiterOverride: { decision: string | null; feedback: string } | null;
}

interface AssessmentInfo {
  id: string;
  jobTitle: string;
  seniority: string;
  domain: string;
  questionCount: number;
  timeLimit: number;
}

interface Stats {
  totalCandidates: number;
  scoredCandidates: number;
  averageScore: number | null;
}

const recommendationConfig: Record<string, { label: string; color: string; border: string }> = {
  strongly_advance: { label: "Strongly Advance", color: "bg-emerald-500/15 text-emerald-400", border: "border-emerald-500/30" },
  advance: { label: "Advance", color: "bg-blue-500/15 text-blue-400", border: "border-blue-500/30" },
  maybe: { label: "Maybe", color: "bg-amber-500/15 text-amber-400", border: "border-amber-500/30" },
  reject: { label: "Reject", color: "bg-red-500/15 text-red-400", border: "border-red-500/30" },
};

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [overrideDecision, setOverrideDecision] = useState<string>("");
  const [overrideFeedback, setOverrideFeedback] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/assessments/${id}/leaderboard`);
    if (res.ok) {
      const data = await res.json();
      setAssessment(data.assessment);
      setCandidates(data.candidates);
      setStats(data.stats);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveOverride = async (submissionId: string) => {
    setSavingOverride(true);
    await fetch(`/api/submissions/${submissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recruiterOverride: {
          decision: overrideDecision || null,
          feedback: overrideFeedback,
        },
      }),
    });
    setOverrideId(null);
    setOverrideDecision("");
    setOverrideFeedback("");
    setSavingOverride(false);
    fetchData();
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

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/assessment/${id}/review`)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Review
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
              <Trophy className="h-7 w-7 text-amber-400" />
              Leaderboard
            </h1>
            <p className="text-zinc-400">{assessment.jobTitle} — {assessment.domain}</p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">
              <Users className="h-3.5 w-3.5" /> Total Candidates
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalCandidates}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">
              <BarChart3 className="h-3.5 w-3.5" /> Average Score
            </div>
            <p className="text-2xl font-bold text-white">{stats.averageScore ?? "—"}<span className="text-sm text-zinc-500">/100</span></p>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">
              <Trophy className="h-3.5 w-3.5" /> Scored
            </div>
            <p className="text-2xl font-bold text-white">{stats.scoredCandidates}<span className="text-sm text-zinc-500">/{stats.totalCandidates}</span></p>
          </div>
        </div>
      )}

      {/* Candidates table */}
      {candidates.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-12 text-center">
          <Users className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 mb-1">No candidates yet</p>
          <p className="text-sm text-zinc-600">Share the test link to get started</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-zinc-900/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3.5 text-left">#</th>
                  <th className="px-5 py-3.5 text-left">Candidate</th>
                  <th className="px-5 py-3.5 text-left">Score</th>
                  <th className="px-5 py-3.5 text-left">AI Recommendation</th>
                  <th className="px-5 py-3.5 text-left">Override</th>
                  <th className="px-5 py-3.5 text-left">Time</th>
                  <th className="px-5 py-3.5 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => {
                  const rec = c.aiRecommendation ? recommendationConfig[c.aiRecommendation] : null;
                  const override = c.recruiterOverride?.decision ? recommendationConfig[c.recruiterOverride.decision] : null;

                  return (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-zinc-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                          c.rank === 1 ? "bg-amber-500/20 text-amber-400" :
                          c.rank === 2 ? "bg-zinc-400/20 text-zinc-300" :
                          c.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                          "bg-zinc-800 text-zinc-500"
                        )}>
                          {c.rank}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-white">{c.candidateName}</p>
                        <p className="text-xs text-zinc-500">{c.candidateEmail}</p>
                      </td>
                      <td className="px-5 py-4">
                        {c.totalScore !== null ? (
                          <span className={cn(
                            "text-lg font-bold",
                            c.totalScore >= 75 ? "text-emerald-400" :
                            c.totalScore >= 50 ? "text-amber-400" : "text-red-400"
                          )}>
                            {c.totalScore}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">{c.status === "submitted" ? "Scoring..." : "In progress"}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {rec ? (
                          <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", rec.color, rec.border)}>
                            {rec.label}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {overrideId === c.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={overrideDecision}
                              onChange={(e) => setOverrideDecision(e.target.value)}
                              className="rounded border border-white/10 bg-zinc-800 px-2 py-1 text-xs text-zinc-200"
                            >
                              <option value="">No override</option>
                              <option value="advance">Advance</option>
                              <option value="reject">Reject</option>
                            </select>
                            <input
                              value={overrideFeedback}
                              onChange={(e) => setOverrideFeedback(e.target.value)}
                              placeholder="Feedback..."
                              className="rounded border border-white/10 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 w-24"
                            />
                            <button
                              onClick={() => handleSaveOverride(c.id)}
                              disabled={savingOverride}
                              className="rounded bg-violet-600 px-2 py-1 text-xs text-white hover:bg-violet-500"
                            >
                              Save
                            </button>
                          </div>
                        ) : override ? (
                          <button onClick={() => { setOverrideId(c.id); setOverrideDecision(c.recruiterOverride?.decision || ""); setOverrideFeedback(c.recruiterOverride?.feedback || ""); }}>
                            <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium cursor-pointer", override.color, override.border)}>
                              {override.label}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setOverrideId(c.id)}
                            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                          >
                            Override
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-400">
                        {c.timeTaken !== null ? (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.timeTaken}m</span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        {c.status === "scored" && (
                          <button
                            onClick={() => router.push(`/assessment/${id}/leaderboard/${c.id}`)}
                            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            Details <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
