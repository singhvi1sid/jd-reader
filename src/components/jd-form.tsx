"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

const PLACEHOLDER_JD = `Paste a job description here...

Example:
We are looking for a Senior Backend Engineer with 5+ years of experience in building scalable distributed systems. You will design and implement microservices using Node.js/TypeScript, manage PostgreSQL and Redis databases, and deploy on AWS using Kubernetes...`;

const STEPS = [
  { label: "Analyzing job description...", at: 0 },
  { label: "Extracting role, skills & responsibilities...", at: 3 },
  { label: "Calibrating difficulty for seniority level...", at: 8 },
  { label: "Generating domain-specific questions...", at: 14 },
  { label: "Creating scenario-based cases...", at: 22 },
  { label: "Building mini-tasks & practical exercises...", at: 30 },
  { label: "Finalizing your assessment...", at: 40 },
];

export function JDForm() {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (isLoading) {
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 0.1);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  const currentStep = STEPS.filter((s) => elapsed >= s.at).pop();
  const progress = Math.min((elapsed / 55) * 100, 98);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim() || isLoading) return;

    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 58000);

      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      router.push(`/assessment/${data.id}/review`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Request timed out. Please try again with a shorter job description.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate assessment");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = jobDescription.length;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-600/50 via-indigo-600/50 to-purple-600/50 opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-500" />

        <div className="relative rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
          <textarea
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              setError(null);
            }}
            placeholder={PLACEHOLDER_JD}
            disabled={isLoading}
            rows={10}
            className="w-full resize-none bg-transparent px-6 pt-5 pb-3 text-[15px] leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center justify-between border-t border-white/5 px-6 py-3.5">
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-xs font-medium tabular-nums",
                charCount < 50 ? "text-zinc-600" : "text-zinc-400"
              )}>
                {charCount} characters
              </span>
              {charCount > 0 && charCount < 50 && (
                <span className="text-xs text-amber-400/80">
                  Minimum 50 characters needed
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || charCount < 50}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300",
                isLoading || charCount < 50
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.98]"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Assessment
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="mt-6 space-y-4">
          {/* Progress bar */}
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current step */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
            </div>
            <p className="text-sm text-zinc-400">{currentStep?.label}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3.5 text-sm text-red-300">
          {error}
        </div>
      )}
    </form>
  );
}
