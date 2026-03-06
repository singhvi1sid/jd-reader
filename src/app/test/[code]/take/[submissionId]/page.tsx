"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Timer } from "@/components/timer";
import { TestQuestion } from "@/components/test-question";
import { ChevronLeft, ChevronRight, Send, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

interface Question {
  type: "MCQ" | "SHORT_ANSWER" | "SCENARIO" | "MINI_TASK";
  content: string;
  options?: string[];
  difficulty: "easy" | "medium" | "hard";
  skillTested: string;
  order: number;
}

interface Answer {
  questionOrder: number;
  answer: string;
}

export default function TestTakePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const submissionId = params.submissionId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(45);
  const [startedAt, setStartedAt] = useState<string>("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    async function load() {
      const [questionsRes, submissionRes] = await Promise.all([
        fetch(`/api/test/${code}/questions`),
        fetch(`/api/submissions/${submissionId}`),
      ]);

      if (questionsRes.ok && submissionRes.ok) {
        const qData = await questionsRes.json();
        const sData = await submissionRes.json();

        if (sData.status !== "in_progress") {
          router.replace(`/test/${code}/complete`);
          return;
        }

        setQuestions(qData.questions);
        setJobTitle(qData.jobTitle);
        setTimeLimit(qData.timeLimit);
        setStartedAt(sData.startedAt);

        // Restore saved answers
        const savedAnswers: Answer[] = sData.answers || [];
        const allAnswers = qData.questions.map((q: Question) => {
          const saved = savedAnswers.find((a: Answer) => a.questionOrder === q.order);
          return { questionOrder: q.order, answer: saved?.answer || "" };
        });
        setAnswers(allAnswers);
      }
      setLoading(false);
    }
    load();
  }, [code, submissionId, router]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!answers.length || submittedRef.current) return;
    const interval = setInterval(() => {
      fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [answers, submissionId]);

  const handleAnswer = useCallback((answer: string) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionOrder === questions[currentIdx]?.order ? { ...a, answer } : a
      )
    );
  }, [currentIdx, questions]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setShowConfirm(false);

    try {
      // Save answers + submit
      await fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, submit: true }),
      });

      // Trigger AI scoring in background
      fetch(`/api/submissions/${submissionId}/score`, { method: "POST" });

      router.replace(`/test/${code}/complete`);
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [answers, submissionId, code, router]);

  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const current = questions[currentIdx];
  const currentAnswer = answers.find((a) => a.questionOrder === current?.order)?.answer || "";
  const answeredCount = answers.filter((a) => a.answer.trim()).length;
  const isLast = currentIdx === questions.length - 1;

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-zinc-900/80 px-5 py-3">
        <div>
          <h1 className="text-sm font-semibold text-white">{jobTitle}</h1>
          <p className="text-xs text-zinc-500">
            Question {currentIdx + 1} of {questions.length}
            <span className="mx-2 text-zinc-700">|</span>
            {answeredCount}/{questions.length} answered
          </p>
        </div>
        {startedAt && (
          <Timer startedAt={startedAt} timeLimitMinutes={timeLimit} onTimeUp={handleTimeUp} />
        )}
      </div>

      {/* Progress dots */}
      <div className="mb-6 flex flex-wrap gap-1.5 justify-center">
        {questions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIdx(idx)}
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-all",
              idx === currentIdx
                ? "bg-violet-500 scale-125"
                : answers[idx]?.answer?.trim()
                ? "bg-emerald-500/60 hover:bg-emerald-400/80"
                : "bg-zinc-700 hover:bg-zinc-600"
            )}
            title={`Question ${idx + 1}${answers[idx]?.answer?.trim() ? " (answered)" : ""}`}
          />
        ))}
      </div>

      {/* Question */}
      {current && (
        <TestQuestion
          question={current}
          answer={currentAnswer}
          onAnswer={handleAnswer}
        />
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all",
            currentIdx === 0
              ? "text-zinc-600 cursor-not-allowed"
              : "bg-zinc-800 text-zinc-300 hover:text-white"
          )}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        {isLast ? (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/25 hover:brightness-110 transition-all"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              <><Send className="h-4 w-4" /> Submit Test</>
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
            className="flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-white transition-all"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Submit your test?</h2>
            <p className="text-sm text-zinc-400 mb-2">
              You have answered <strong className="text-white">{answeredCount}</strong> of <strong className="text-white">{questions.length}</strong> questions.
            </p>
            {answeredCount < questions.length && (
              <p className="text-xs text-amber-400/80 mb-4">
                {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} unanswered. You cannot return after submitting.
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-white/10 bg-zinc-800 py-2.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
              >
                {submitting ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
