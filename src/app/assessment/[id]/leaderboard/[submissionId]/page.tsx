"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, User, Mail, Clock, BarChart3,
  CircleDot, MessageSquareText, Lightbulb, Code2,
  ThumbsUp, ThumbsDown, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface Score {
  questionOrder: number;
  score: number;
  reasoning: string;
  strengths: string;
  weaknesses: string;
}

interface Question {
  type: string;
  content: string;
  options?: string[];
  expectedAnswer?: string;
  difficulty: string;
  skillTested: string;
  order: number;
}

const typeConfig: Record<string, { icon: typeof CircleDot; label: string; bg: string; text: string }> = {
  MCQ: { icon: CircleDot, label: "MCQ", bg: "bg-blue-500/10", text: "text-blue-400" },
  SHORT_ANSWER: { icon: MessageSquareText, label: "Short Answer", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  SCENARIO: { icon: Lightbulb, label: "Scenario", bg: "bg-amber-500/10", text: "text-amber-400" },
  MINI_TASK: { icon: Code2, label: "Mini Task", bg: "bg-rose-500/10", text: "text-rose-400" },
};

const recommendationConfig: Record<string, { label: string; color: string }> = {
  strongly_advance: { label: "Strongly Advance", color: "text-emerald-400" },
  advance: { label: "Advance", color: "text-blue-400" },
  maybe: { label: "Maybe", color: "text-amber-400" },
  reject: { label: "Reject", color: "text-red-400" },
};

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const submissionId = params.submissionId as string;

  const [submission, setSubmission] = useState<{
    candidateName: string;
    candidateEmail: string;
    totalScore: number;
    aiRecommendation: string;
    aiSummary: string;
    startedAt: string;
    submittedAt: string;
    answers: { questionOrder: number; answer: string }[];
    scores: Score[];
  } | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    const [subRes, assessRes] = await Promise.all([
      fetch(`/api/submissions/${submissionId}`),
      fetch(`/api/assessments/${assessmentId}`),
    ]);
    if (subRes.ok && assessRes.ok) {
      setSubmission(await subRes.json());
      const a = await assessRes.json();
      setQuestions(a.questions);
    }
    setLoading(false);
  }, [submissionId, assessmentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleExpand = (order: number) => {
    setExpandedQ((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order); else next.add(order);
      return next;
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>;
  }

  if (!submission) {
    return <div className="flex items-center justify-center min-h-[60vh] text-zinc-400">Submission not found</div>;
  }

  const timeTaken = submission.submittedAt && submission.startedAt
    ? Math.round((new Date(submission.submittedAt).getTime() - new Date(submission.startedAt).getTime()) / 60000)
    : null;
  const rec = submission.aiRecommendation ? recommendationConfig[submission.aiRecommendation] : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <button
        onClick={() => router.push(`/assessment/${assessmentId}/leaderboard`)}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Leaderboard
      </button>

      {/* Candidate header */}
      <div className="mb-8 rounded-xl border border-white/10 bg-zinc-900/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <User className="h-6 w-6 text-violet-400" />
              {submission.candidateName}
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-zinc-400 mt-1">
              <Mail className="h-3.5 w-3.5" /> {submission.candidateEmail}
            </p>
          </div>
          <div className="text-right">
            <p className={cn("text-4xl font-bold", submission.totalScore >= 75 ? "text-emerald-400" : submission.totalScore >= 50 ? "text-amber-400" : "text-red-400")}>
              {submission.totalScore}<span className="text-lg text-zinc-500">/100</span>
            </p>
            {rec && <p className={cn("text-sm font-medium mt-1", rec.color)}>{rec.label}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 border-t border-white/5 pt-4">
          {timeTaken !== null && (
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {timeTaken} minutes</span>
          )}
          <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4" /> {submission.scores.length} questions scored</span>
        </div>

        {submission.aiSummary && (
          <div className="mt-4 rounded-lg border border-violet-500/20 bg-violet-500/5 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-violet-400 mb-1.5">AI Summary</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{submission.aiSummary}</p>
          </div>
        )}
      </div>

      {/* Per-question breakdown */}
      <h2 className="text-lg font-semibold text-white mb-5">Question-by-Question Breakdown</h2>
      <div className="space-y-3">
        {questions.map((q) => {
          const score = submission.scores.find((s) => s.questionOrder === q.order);
          const answer = submission.answers.find((a) => a.questionOrder === q.order);
          const config = typeConfig[q.type] || typeConfig.MCQ;
          const Icon = config.icon;
          const isExpanded = expandedQ.has(q.order);

          return (
            <div key={q.order} className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
              {/* Summary row */}
              <button
                onClick={() => toggleExpand(q.order)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium shrink-0", config.bg, config.text)}>
                    <Icon className="h-3 w-3" />{config.label}
                  </span>
                  <span className="text-sm text-zinc-300 truncate">{q.content.slice(0, 80)}...</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {score && (
                    <span className={cn(
                      "text-lg font-bold",
                      score.score >= 7 ? "text-emerald-400" : score.score >= 4 ? "text-amber-400" : "text-red-400"
                    )}>
                      {score.score}<span className="text-xs text-zinc-500">/10</span>
                    </span>
                  )}
                  <ChevronDown className={cn("h-4 w-4 text-zinc-500 transition-transform", isExpanded && "rotate-180")} />
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-white/5 px-5 py-5 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">Question</p>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{q.content}</p>
                  </div>

                  {q.expectedAnswer && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">Expected Answer</p>
                      <p className="text-sm text-zinc-400 whitespace-pre-wrap">{q.expectedAnswer}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">Candidate&apos;s Answer</p>
                    <div className="rounded-lg border border-white/5 bg-zinc-800/50 px-4 py-3">
                      <p className="text-sm text-zinc-200 whitespace-pre-wrap">{answer?.answer || "[No answer provided]"}</p>
                    </div>
                  </div>

                  {score && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">AI Reasoning</p>
                        <p className="text-sm text-zinc-400 leading-relaxed">{score.reasoning}</p>
                      </div>
                      <div className="space-y-3">
                        {score.strengths && (
                          <div>
                            <p className="flex items-center gap-1 text-xs font-medium text-emerald-400 mb-1">
                              <ThumbsUp className="h-3 w-3" /> Strengths
                            </p>
                            <p className="text-sm text-zinc-400">{score.strengths}</p>
                          </div>
                        )}
                        {score.weaknesses && (
                          <div>
                            <p className="flex items-center gap-1 text-xs font-medium text-red-400 mb-1">
                              <ThumbsDown className="h-3 w-3" /> Weaknesses
                            </p>
                            <p className="text-sm text-zinc-400">{score.weaknesses}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
