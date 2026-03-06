"use client";

import { useState } from "react";
import { Copy, Check, Send, Loader2, X, Mail, Plus, Link2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface ShareDialogProps {
  assessmentId: string;
  accessCode: string;
  jobTitle: string;
  onClose: () => void;
}

export function ShareDialog({ assessmentId, accessCode, jobTitle, onClose }: ShareDialogProps) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const testLink = `${baseUrl}/test/${accessCode}`;

  const addEmail = () => setEmails((prev) => [...prev, ""]);
  const removeEmail = (idx: number) => setEmails((prev) => prev.filter((_, i) => i !== idx));
  const updateEmail = (idx: number, val: string) =>
    setEmails((prev) => prev.map((e, i) => (i === idx ? val : e)));

  const validEmails = emails.filter((e) => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()));

  const handleSend = async () => {
    if (validEmails.length === 0) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/assessments/${assessmentId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: validEmails }),
      });
      const data = await res.json();

      if (!res.ok) {
        const details = data?.details ? ` (${data.details})` : "";
        throw new Error((data.error || "Failed to send") + details);
      }

      setSendResult(data);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitations");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Share Assessment</h2>
            <p className="text-sm text-zinc-400 mt-1">{jobTitle}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Access Code + Link */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2 block">Access Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-white/10 bg-zinc-800 px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] text-white">
                {accessCode}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(accessCode); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }}
                className="rounded-lg border border-white/10 bg-zinc-800 p-3 text-zinc-300 hover:text-white transition-colors"
              >
                {copiedCode ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2 block">Test Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-white/10 bg-zinc-800 px-4 py-3 text-sm text-zinc-300 truncate">
                {testLink}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(testLink); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }}
                className="rounded-lg border border-white/10 bg-zinc-800 p-3 text-zinc-300 hover:text-white transition-colors"
              >
                {copiedLink ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-zinc-900 px-3 text-zinc-600">or send via email</span>
          </div>
        </div>

        {/* Email inputs */}
        {!sent ? (
          <>
            <div className="space-y-2 mb-4">
              {emails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateEmail(idx, e.target.value)}
                      placeholder="candidate@email.com"
                      className="w-full rounded-lg border border-white/10 bg-zinc-800 pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  {emails.length > 1 && (
                    <button onClick={() => removeEmail(idx)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addEmail}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 mb-4 transition-colors"
            >
              <Plus className="h-3 w-3" /> Add another email
            </button>

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <button
              onClick={handleSend}
              disabled={validEmails.length === 0 || sending}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all",
                validEmails.length === 0 || sending
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 hover:brightness-110"
              )}
            >
              {sending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="h-4 w-4" /> Send Invitation{validEmails.length > 1 ? "s" : ""} ({validEmails.length})</>
              )}
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-white font-medium mb-1">
              {sendResult?.sent === sendResult?.total
                ? `${sendResult?.sent} invitation${sendResult!.sent > 1 ? "s" : ""} sent!`
                : `${sendResult?.sent} of ${sendResult?.total} sent`}
            </p>
            <p className="text-sm text-zinc-400">Candidates will receive an email with the test link and access code.</p>
            <button
              onClick={() => { setSent(false); setEmails([""]); setSendResult(null); }}
              className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Send to more candidates
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
