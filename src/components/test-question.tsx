"use client";

import { cn } from "@/lib/cn";
import { CircleDot, MessageSquareText, Lightbulb, Code2 } from "lucide-react";
import { useMemo } from "react";

interface Question {
  type: "MCQ" | "SHORT_ANSWER" | "SCENARIO" | "MINI_TASK";
  content: string;
  options?: string[];
  difficulty: "easy" | "medium" | "hard";
  skillTested: string;
  order: number;
}

const typeConfig = {
  MCQ: { icon: CircleDot, label: "Multiple Choice", bg: "bg-blue-500/10", text: "text-blue-400" },
  SHORT_ANSWER: { icon: MessageSquareText, label: "Short Answer", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  SCENARIO: { icon: Lightbulb, label: "Scenario", bg: "bg-amber-500/10", text: "text-amber-400" },
  MINI_TASK: { icon: Code2, label: "Mini Task", bg: "bg-rose-500/10", text: "text-rose-400" },
};

function renderContentWithTables(content: string) {
  const lines = content.split("\n");
  const blocks: { type: "text" | "table"; content: string; rows?: string[][] }[] = [];
  let currentText: string[] = [];
  let tableRows: string[] = [];
  const flushText = () => { if (currentText.length) { blocks.push({ type: "text", content: currentText.join("\n") }); currentText = []; } };
  const flushTable = () => { if (tableRows.length) { const parsed = tableRows.filter((r) => !/^[\s|:-]+$/.test(r)).map((r) => r.split("|").map((c) => c.trim()).filter(Boolean)); blocks.push({ type: "table", content: "", rows: parsed }); tableRows = []; } };
  for (const line of lines) { if (line.trim().startsWith("|")) { flushText(); tableRows.push(line); } else { flushTable(); currentText.push(line); } }
  flushText(); flushTable();
  return (<>{blocks.map((block, i) => { if (block.type === "table" && block.rows?.length) { const [header, ...body] = block.rows; return (<div key={i} className="my-4 overflow-x-auto rounded-lg border border-white/10"><table className="w-full text-sm"><thead><tr className="bg-zinc-800/80">{header.map((c, j) => (<th key={j} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">{c}</th>))}</tr></thead><tbody>{body.map((row, j) => (<tr key={j} className="border-t border-white/5">{row.map((c, k) => (<td key={k} className="px-4 py-2.5 text-zinc-300">{c}</td>))}</tr>))}</tbody></table></div>); } return (<p key={i} className="text-[15px] leading-relaxed text-zinc-200 whitespace-pre-wrap">{block.content}</p>); })}</>);
}

interface Props {
  question: Question;
  answer: string;
  onAnswer: (answer: string) => void;
}

export function TestQuestion({ question, answer, onAnswer }: Props) {
  const config = typeConfig[question.type];
  const Icon = config.icon;
  const hasTable = useMemo(() => question.content.includes("|"), [question.content]);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 overflow-hidden">
      <div className="p-6 sm:p-8">
        {/* Type badge */}
        <div className="flex items-center gap-2 mb-5">
          <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", config.bg, config.text)}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
            {question.skillTested}
          </span>
        </div>

        {/* Question */}
        <div className="mb-6">
          {hasTable ? renderContentWithTables(question.content) : (
            <p className="text-base leading-relaxed text-zinc-100 whitespace-pre-wrap">{question.content}</p>
          )}
        </div>

        {/* Answer area */}
        {question.type === "MCQ" && question.options ? (
          <div className="space-y-2.5">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => onAnswer(option)}
                className={cn(
                  "w-full flex items-start gap-3 rounded-xl border px-5 py-4 text-left text-sm transition-all",
                  answer === option
                    ? "border-violet-500/50 bg-violet-500/10 text-white"
                    : "border-white/5 bg-zinc-800/50 text-zinc-300 hover:border-white/15 hover:bg-zinc-800"
                )}
              >
                <span className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium mt-0.5",
                  answer === option
                    ? "border-violet-400 bg-violet-500/20 text-violet-300"
                    : "border-white/20 text-zinc-500"
                )}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="pt-0.5">{option}</span>
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder={
              question.type === "MINI_TASK"
                ? "Write your solution here..."
                : question.type === "SCENARIO"
                ? "Describe your approach..."
                : "Type your answer here..."
            }
            rows={question.type === "MINI_TASK" ? 12 : question.type === "SCENARIO" ? 8 : 5}
            className="w-full rounded-xl border border-white/10 bg-zinc-800/80 px-5 py-4 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-y"
          />
        )}
      </div>
    </div>
  );
}
