import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SectionContainerProps {
  title: string
  count?: number
  accentClassName?: string
  children: React.ReactNode
}

export function SectionContainer({
  title,
  count,
  accentClassName,
  children,
}: SectionContainerProps) {
  return (
    <Card className="h-full gap-4 py-4">
      <CardHeader className="px-4 pb-0 sm:px-6">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <span>{title}</span>
          {typeof count === "number" && (
            <span
              className={cn(
                "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                accentClassName ?? "bg-muted text-muted-foreground"
              )}
            >
              {count}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">{children}</CardContent>
    </Card>
  )
}
