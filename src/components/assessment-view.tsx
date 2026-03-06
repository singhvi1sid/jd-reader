"use client";

import { QuestionCard } from "./question-card";
import {
  Briefcase,
  BarChart3,
  Globe,
  Tag,
  Copy,
  Check,
  CircleDot,
  MessageSquareText,
  Lightbulb,
  Code2,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useState } from "react";

interface Question {
  type: "MCQ" | "SHORT_ANSWER" | "SCENARIO" | "MINI_TASK";
  content: string;
  options?: string[];
  expectedAnswer?: string;
  difficulty: "easy" | "medium" | "hard";
  skillTested: string;
  order: number;
}

interface AssessmentData {
  id: string;
  jobTitle: string;
  seniority: string;
  domain: string;
  skills: string[];
  niceToHaveSkills: string[];
  keyResponsibilities: string[];
  questions: Question[];
}

const seniorityColors: Record<string, string> = {
  junior: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  mid: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  senior: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  lead: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const sectionConfig = {
  MCQ: { icon: CircleDot, label: "Multiple Choice Questions", color: "text-blue-400" },
  SHORT_ANSWER: { icon: MessageSquareText, label: "Short Answer Questions", color: "text-emerald-400" },
  SCENARIO: { icon: Lightbulb, label: "Scenario-Based Cases", color: "text-amber-400" },
  MINI_TASK: { icon: Code2, label: "Mini Tasks", color: "text-rose-400" },
};

export function AssessmentView({ assessment }: { assessment: AssessmentData }) {
  const [copied, setCopied] = useState(false);

  const groupedQuestions = {
    MCQ: assessment.questions.filter((q) => q.type === "MCQ"),
    SHORT_ANSWER: assessment.questions.filter((q) => q.type === "SHORT_ANSWER"),
    SCENARIO: assessment.questions.filter((q) => q.type === "SCENARIO"),
    MINI_TASK: assessment.questions.filter((q) => q.type === "MINI_TASK"),
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Role Header */}
      <div className="mb-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              {assessment.jobTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                seniorityColors[assessment.seniority] || seniorityColors.mid
              )}>
                <BarChart3 className="h-3 w-3" />
                {assessment.seniority}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-800/80 px-3 py-1 text-xs font-medium text-zinc-300">
                <Globe className="h-3 w-3 text-zinc-500" />
                {assessment.domain}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-800/80 px-3 py-1 text-xs font-medium text-zinc-300">
                <Briefcase className="h-3 w-3 text-zinc-500" />
                {assessment.questions.length} questions
              </span>
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/80 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700/80 hover:text-white transition-all"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
              <Tag className="h-3 w-3" />
              Required Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {assessment.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          {assessment.niceToHaveSkills.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
                <Tag className="h-3 w-3" />
                Nice to Have
              </p>
              <div className="flex flex-wrap gap-1.5">
                {assessment.niceToHaveSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-zinc-800 border border-white/5 px-2.5 py-1 text-xs text-zinc-400"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {assessment.keyResponsibilities?.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
                <ClipboardList className="h-3 w-3" />
                Key Responsibilities
              </p>
              <ul className="space-y-1.5">
                {assessment.keyResponsibilities.map((resp, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500/50" />
                    {resp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Question Sections */}
      <div className="space-y-10">
        {(Object.keys(sectionConfig) as Array<keyof typeof sectionConfig>).map((type) => {
          const questions = groupedQuestions[type];
          if (!questions.length) return null;
          const config = sectionConfig[type];
          const Icon = config.icon;

          return (
            <section key={type}>
              <div className="flex items-center gap-2.5 mb-5">
                <Icon className={cn("h-5 w-5", config.color)} />
                <h2 className="text-lg font-semibold text-white">{config.label}</h2>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {questions.length}
                </span>
              </div>
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <QuestionCard key={idx} question={q} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
