"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";

interface TimerProps {
  startedAt: string;
  timeLimitMinutes: number;
  onTimeUp: () => void;
}

export function Timer({ startedAt, timeLimitMinutes, onTimeUp }: TimerProps) {
  const [remaining, setRemaining] = useState<number>(timeLimitMinutes * 60);

  const calculateRemaining = useCallback(() => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    const total = timeLimitMinutes * 60;
    return Math.max(0, total - elapsed);
  }, [startedAt, timeLimitMinutes]);

  useEffect(() => {
    setRemaining(calculateRemaining());
    const interval = setInterval(() => {
      const r = calculateRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateRemaining, onTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining < 300;
  const isCritical = remaining < 60;

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-mono font-semibold tabular-nums",
      isCritical
        ? "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse"
        : isLow
        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
        : "border-white/10 bg-zinc-800/80 text-zinc-200"
    )}>
      <Clock className="h-4 w-4" />
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}
