export default function DashboardLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="bg-card/70 h-32 animate-pulse rounded-xl border"
          key={`skeleton-${index}`}
        />
      ))}
    </div>
  )
}
