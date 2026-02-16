export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            className="bg-card/70 h-32 animate-pulse rounded-xl border"
            key={`skeleton-${index}`}
          />
        ))}
      </div>
    </div>
  )
}
