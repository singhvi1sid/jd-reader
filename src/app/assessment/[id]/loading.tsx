export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header skeleton */}
      <div className="mb-10">
        <div className="h-8 w-80 rounded-lg bg-zinc-800 animate-pulse mb-4" />
        <div className="flex gap-2 mb-6">
          <div className="h-6 w-16 rounded-full bg-zinc-800 animate-pulse" />
          <div className="h-6 w-32 rounded-full bg-zinc-800 animate-pulse" />
          <div className="h-6 w-24 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 w-20 rounded-md bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Question skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="mb-6 rounded-xl border border-white/5 bg-zinc-900/60 p-6">
          <div className="flex gap-2 mb-4">
            <div className="h-5 w-28 rounded-full bg-zinc-800 animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-zinc-800 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-zinc-800 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-zinc-800 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
