"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-white/80 p-6 text-center shadow-sm dark:bg-slate-900/70">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          An unexpected error occurred. You can retry safely.
        </p>
        <Button className="mt-4" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  )
}
