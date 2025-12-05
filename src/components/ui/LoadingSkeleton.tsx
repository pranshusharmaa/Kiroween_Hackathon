interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      <div className="h-5 w-32 rounded bg-zinc-800/70" />
      <div className="h-16 w-full rounded-2xl bg-zinc-900/70" />
    </div>
  );
}

export function CardLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-24 rounded bg-zinc-800/70" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-zinc-900/70" />
        <div className="h-3 w-3/4 rounded bg-zinc-900/70" />
      </div>
    </div>
  );
}

export function ListLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="rounded-2xl border border-zinc-800/80 bg-[#060814] px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-12 rounded-full bg-zinc-800/70" />
              <div className="h-4 w-16 rounded-full bg-zinc-800/70" />
            </div>
            <div className="h-4 w-3/4 rounded bg-zinc-900/70 mb-2" />
            <div className="h-3 w-1/2 rounded bg-zinc-900/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
