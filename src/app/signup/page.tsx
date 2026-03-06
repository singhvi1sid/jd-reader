"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, Mail, Lock, User } from "lucide-react";
import { cn } from "@/lib/cn";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      // Auto sign-in after signup
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-sm text-zinc-400 mt-1">Start creating AI-powered assessments</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full rounded-xl border border-white/10 bg-zinc-800/80 pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="Email address"
              required
              className="w-full rounded-xl border border-white/10 bg-zinc-800/80 pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Password (min 6 characters)"
              required
              minLength={6}
              className="w-full rounded-xl border border-white/10 bg-zinc-800/80 pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name || !email || !password}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all",
              loading || !name || !email || !password
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 hover:brightness-110"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
