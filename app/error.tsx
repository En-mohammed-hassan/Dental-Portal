"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-white/80 p-8 text-center shadow-lg dark:bg-slate-900/70">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
          <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Oops!</h1>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. Don't worry, you can retry safely or return to the dashboard.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-left dark:bg-red-900/10">
              <p className="text-xs font-mono text-red-600 dark:text-red-400">{error.message}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild>
            <Link href="/reservations">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
