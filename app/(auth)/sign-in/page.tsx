import { Suspense } from "react"

import { SignInPage } from "@/components/auth/sign-in-page"

function SignInFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <p className="text-sm text-slate-500">Loading…</p>
    </div>
  )
}

export default function SignInRoutePage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInPage />
    </Suspense>
  )
}
