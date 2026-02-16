import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-white/80 p-6 text-center shadow-sm dark:bg-slate-900/70">
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          The page you requested does not exist or has been moved.
        </p>
        <Button asChild className="mt-4">
          <Link href="/reservations">Go to Reservations</Link>
        </Button>
      </div>
    </div>
  )
}
