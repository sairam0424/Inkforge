export function ArticleSkeletons({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-bg-surface border border-border rounded-[14px] p-5 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-bg-elevated rounded-full animate-pulse" />
            <div className="h-5 w-14 bg-bg-elevated rounded-full animate-pulse" />
          </div>
          <div className="h-5 w-4/5 bg-bg-elevated rounded animate-pulse" />
          <div className="h-4 w-full bg-bg-elevated rounded animate-pulse" />
          <div className="h-4 w-3/5 bg-bg-elevated rounded animate-pulse" />
          <div className="flex gap-1.5 pt-1">
            {[1, 2, 3].map((j) => <div key={j} className="h-4 w-12 bg-bg-elevated rounded-full animate-pulse" />)}
          </div>
          <div className="flex justify-between pt-1">
            <div className="h-3 w-20 bg-bg-elevated rounded animate-pulse" />
            <div className="h-3 w-24 bg-bg-elevated rounded animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
}
