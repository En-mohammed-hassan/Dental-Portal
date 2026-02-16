export default function ReservationsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="bg-card/70 h-48 animate-pulse rounded-xl border"
            key={`skeleton-${index}`}
          />
        ))}
      </div>
    </div>
  )
}
