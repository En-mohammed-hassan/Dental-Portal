import { Card, CardContent } from "@/components/ui/card"

interface StatsSummaryProps {
  waitingCount: number
  upcomingCount: number
  emergencyCount: number
}

export function StatsSummary({
  waitingCount,
  upcomingCount,
  emergencyCount,
}: StatsSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card className="gap-2 py-4">
        <CardContent className="px-4">
          <p className="text-muted-foreground text-sm">Total Waiting</p>
          <p className="text-2xl font-bold">{waitingCount}</p>
        </CardContent>
      </Card>
      <Card className="gap-2 py-4">
        <CardContent className="px-4">
          <p className="text-muted-foreground text-sm">Total Upcoming</p>
          <p className="text-2xl font-bold">{upcomingCount}</p>
        </CardContent>
      </Card>
      <Card className="gap-2 border-red-300 py-4 dark:border-red-900">
        <CardContent className="px-4">
          <p className="text-muted-foreground text-sm">Emergency Cases</p>
          <p className="text-2xl font-bold text-red-600">{emergencyCount}</p>
        </CardContent>
      </Card>
    </div>
  )
}
