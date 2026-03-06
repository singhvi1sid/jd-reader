import { CheckCircle2 } from "lucide-react";

export default function TestCompletePage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
          Test Submitted!
        </h1>
        <p className="text-zinc-400 leading-relaxed mb-2">
          Your responses have been recorded and will be evaluated shortly.
        </p>
        <p className="text-sm text-zinc-500">
          The recruiter will review your results and get back to you. You can close this tab.
        </p>
      </div>
    </div>
  );
}
