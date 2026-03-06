"use client";

import Link from "next/link";
import { FileText, LogOut, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09090b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
            <FileText className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            AssessAI
          </span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Home
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                My Assessments
              </Link>
              <div className="flex items-center gap-3 pl-2 border-l border-white/10">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-sm text-zinc-300 max-w-[120px] truncate">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-all"
                >
                  <LogOut className="h-3 w-3" />
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-600/25 hover:brightness-110 transition-all"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
