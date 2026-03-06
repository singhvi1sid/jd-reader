import { JDForm } from "@/components/jd-form";
import { Zap, Target, Brain } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-r from-violet-600/15 via-indigo-600/10 to-purple-600/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Hero Section */}
        <section className="flex flex-col items-center pt-20 pb-16 sm:pt-28 sm:pb-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-xs font-medium text-violet-300">
            <Zap className="h-3 w-3" />
            AI-Powered Assessment Generation
          </div>

          <h1 className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            <span className="text-white">Turn any </span>
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              Job Description
            </span>
            <br />
            <span className="text-white">into a tailored assessment</span>
          </h1>

          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-zinc-400">
            Paste a job description and get a role-specific test in seconds.
            MCQs, short answers, real-world scenarios, and practical tasks — 
            calibrated to the exact seniority and skill set.
          </p>
        </section>

        {/* Form */}
        <section className="pb-20">
          <JDForm />
        </section>

        {/* How it Works */}
        <section className="pb-24">
          <h2 className="text-center text-sm font-medium uppercase tracking-widest text-zinc-500 mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Paste the JD",
                description:
                  "Drop in any job description — from junior developer to VP of Engineering.",
              },
              {
                icon: Brain,
                title: "AI Analyzes",
                description:
                  "Gemini extracts the role, seniority, skills, and domain to understand what matters.",
              },
              {
                icon: Zap,
                title: "Get Assessment",
                description:
                  "Receive a comprehensive, difficulty-calibrated test with multiple question formats.",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl border border-white/5 bg-zinc-900/50 p-6 hover:border-white/10 transition-all duration-300"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/10">
                  <step.icon className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{step.description}</p>
                <span className="absolute top-5 right-5 text-xs font-bold text-zinc-800">
                  0{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
