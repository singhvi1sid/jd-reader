"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, Clock, HelpCircle, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

interface AssessmentInfo {
  jobTitle: string;
  questionCount: number;
  timeLimit: number;
  domain: string;
  seniority: string;
}

export default function TestEntryPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [info, setInfo] = useState<AssessmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInfo() {
      const res = await fetch(`/api/test/${code}`);
      if (res.ok) {
        setInfo(await res.json());
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    fetchInfo();
  }, [code]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStarting(true);
    setError(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: code, candidateName: name, candidateEmail: email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start test");
      }

      router.push(`/test/${code}/take/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Invalid Access Code</h1>
        <p className="text-zinc-400">This test link is invalid or has expired. Please check the code and try again.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            {info?.jobTitle}
          </h1>
          <p className="text-zinc-400">Technical Assessment</p>
        </div>

        <div className="flex justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <HelpCircle className="h-4 w-4 text-violet-400" />
            {info?.questionCount} questions
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Clock className="h-4 w-4 text-violet-400" />
            {info?.timeLimit} minutes
          </div>
        </div>

        <form onSubmit={handleStart} className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 sm:p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={starting || !name.trim() || !email.trim()}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all",
              starting || !name.trim() || !email.trim()
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 hover:brightness-110"
            )}
          >
            {starting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Starting...</>
            ) : (
              <><ArrowRight className="h-4 w-4" /> Start Assessment</>
            )}
          </button>

          <p className="text-xs text-center text-zinc-600">
            Once started, you will have {info?.timeLimit} minutes to complete the test.
            The timer cannot be paused.
          </p>
        </form>
      </div>
    </div>
  );
}
