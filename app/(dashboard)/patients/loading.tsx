export default function PatientsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="bg-card/70 h-24 animate-pulse rounded-xl border"
            key={`skeleton-${index}`}
          />
        ))}
      </div>
    </div>
  )
}
