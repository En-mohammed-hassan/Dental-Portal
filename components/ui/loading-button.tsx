import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LoadingButton({
  loading,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> & {
  loading?: boolean
  loadingText?: React.ReactNode
}) {
  return (
    <Button
      className={cn(className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
