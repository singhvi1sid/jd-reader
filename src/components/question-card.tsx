"use client";

import { cn } from "@/lib/cn";
import {
  CircleDot,
  MessageSquareText,
  Lightbulb,
  Code2,
  ChevronDown,
} from "lucide-react";
import { useState, useMemo } from "react";

interface Question {
  type: "MCQ" | "SHORT_ANSWER" | "SCENARIO" | "MINI_TASK";
  content: string;
  options?: string[];
  expectedAnswer?: string;
  difficulty: "easy" | "medium" | "hard";
  skillTested: string;
  order: number;
}

const typeConfig = {
  MCQ: {
    icon: CircleDot,
    label: "Multiple Choice",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  SHORT_ANSWER: {
    icon: MessageSquareText,
    label: "Short Answer",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  SCENARIO: {
    icon: Lightbulb,
    label: "Scenario",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  MINI_TASK: {
    icon: Code2,
    label: "Mini Task",
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
  },
};

const difficultyConfig = {
  easy: { label: "Easy", color: "bg-emerald-500/15 text-emerald-400" },
  medium: { label: "Medium", color: "bg-amber-500/15 text-amber-400" },
  hard: { label: "Hard", color: "bg-red-500/15 text-red-400" },
};

function renderContentWithTables(content: string) {
  const lines = content.split("\n");
  const blocks: { type: "text" | "table"; content: string; rows?: string[][] }[] = [];
  let currentText: string[] = [];
  let tableRows: string[] = [];

  const flushText = () => {
    if (currentText.length > 0) {
      blocks.push({ type: "text", content: currentText.join("\n") });
      currentText = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const parsed = tableRows
        .filter((row) => !/^[\s|:-]+$/.test(row))
        .map((row) =>
          row.split("|").map((cell) => cell.trim()).filter(Boolean)
        );
      blocks.push({ type: "table", content: "", rows: parsed });
      tableRows = [];
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("|")) {
      flushText();
      tableRows.push(line);
    } else {
      flushTable();
      currentText.push(line);
    }
  }
  flushText();
  flushTable();

  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "table" && block.rows && block.rows.length > 0) {
          const [header, ...body] = block.rows;
          return (
            <div key={i} className="my-4 overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-800/80">
                    {header.map((cell, j) => (
                      <th key={j} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, j) => (
                    <tr key={j} className="border-t border-white/5">
                      {row.map((cell, k) => (
                        <td key={k} className="px-4 py-2.5 text-zinc-300">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <p key={i} className="text-[15px] leading-relaxed text-zinc-200 whitespace-pre-wrap">
            {block.content}
          </p>
        );
      })}
    </>
  );
}

export function QuestionCard({ question }: { question: Question }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const config = typeConfig[question.type];
  const difficulty = difficultyConfig[question.difficulty];
  const Icon = config.icon;

  const hasTable = useMemo(() => question.content.includes("|"), [question.content]);

  return (
    <div className={cn(
      "rounded-xl border bg-zinc-900/60 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-white/15",
      config.border
    )}>
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", config.bg, config.text)}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", difficulty.color)}>
            {difficulty.label}
          </span>
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
            {question.skillTested}
          </span>
        </div>

        {/* Question content */}
        {hasTable ? (
          <div>{renderContentWithTables(question.content)}</div>
        ) : (
          <p className="text-[15px] leading-relaxed text-zinc-200 whitespace-pre-wrap">
            {question.content}
          </p>
        )}

        {/* MCQ Options */}
        {question.type === "MCQ" && question.options && (
          <div className="mt-4 space-y-2">
            {question.options.map((option, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-300"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs text-zinc-400 mt-0.5">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </div>
            ))}
          </div>
        )}

        {/* Expected answer toggle */}
        {question.expectedAnswer && (
          <div className="mt-4">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAnswer && "rotate-180")} />
              {showAnswer ? "Hide" : "Show"} expected answer
            </button>
            {showAnswer && (
              <div className="mt-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-zinc-300 leading-relaxed">
                {question.expectedAnswer}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
