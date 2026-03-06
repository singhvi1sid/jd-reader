"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, FileText, Trophy, Link2, Clock,
  BarChart3, Globe, Briefcase, Plus, Send,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ShareDialog } from "@/components/share-dialog";

interface AssessmentItem {
  id: string;
  jobTitle: string;
  seniority: string;
  domain: string;
  status: "draft" | "reviewing" | "finalized";
  accessCode?: string;
  timeLimit: number;
  questionCount: number;
  createdAt: string;
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-zinc-700 text-zinc-300", border: "border-zinc-600" },
  reviewing: { label: "In Review", color: "bg-amber-500/15 text-amber-400", border: "border-amber-500/30" },
  finalized: { label: "Live", color: "bg-emerald-500/15 text-emerald-400", border: "border-emerald-500/30" },
};

const seniorityColors: Record<string, string> = {
  junior: "text-emerald-400",
  mid: "text-blue-400",
  senior: "text-amber-400",
  lead: "text-rose-400",
};

export default function DashboardPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareId, setShareId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/assessments");
      if (res.ok) setAssessments(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            My Assessments
          </h1>
          <p className="text-zinc-400 mt-1">All assessments you have created</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/25 hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" /> New Assessment
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-16 text-center">
          <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 mb-2">No assessments yet</p>
          <p className="text-sm text-zinc-600 mb-6">Paste a job description on the home page to create your first one.</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            Create Assessment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => {
            const st = statusConfig[a.status];
            const timeAgo = getTimeAgo(a.createdAt);

            return (
              <div
                key={a.id}
                className="group rounded-xl border border-white/10 bg-zinc-900/80 p-5 hover:border-white/15 transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <h2 className="text-base font-semibold text-white truncate">{a.jobTitle}</h2>
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", st.color, st.border)}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span className={cn("font-medium uppercase", seniorityColors[a.seniority] || "text-zinc-400")}>
                        {a.seniority}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />{a.domain}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />{a.questionCount} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{a.timeLimit} min
                      </span>
                      <span>{timeAgo}</span>
                    </div>
                    {a.accessCode && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <Link2 className="h-3 w-3" /> Code:
                        </span>
                        <span className="font-mono text-xs font-semibold tracking-wider text-violet-400">{a.accessCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => router.push(`/assessment/${a.id}/review`)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" /> Review
                    </button>
                    {a.status === "finalized" && (
                      <>
                        <button
                          onClick={() => setShareId(a.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-600/10 px-3.5 py-2 text-xs font-medium text-violet-300 hover:bg-violet-600/20 transition-colors"
                        >
                          <Send className="h-3.5 w-3.5" /> Share
                        </button>
                        <button
                          onClick={() => router.push(`/assessment/${a.id}/leaderboard`)}
                          className="flex items-center gap-1.5 rounded-lg bg-violet-600/80 px-3.5 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
                        >
                          <Trophy className="h-3.5 w-3.5" /> Leaderboard
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shareId && (() => {
        const a = assessments.find((x) => x.id === shareId);
        return a?.accessCode ? (
          <ShareDialog
            assessmentId={a.id}
            accessCode={a.accessCode}
            jobTitle={a.jobTitle}
            onClose={() => setShareId(null)}
          />
        ) : null;
      })()}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
