"use client"

import Link from "next/link"
import { AlertCircle, ArrowLeft, Home } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  const { t } = useTranslation("common")

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-white/80 p-8 text-center shadow-lg dark:bg-slate-900/70">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">404</h1>
          <h2 className="text-xl font-semibold">{t("errorsPage.notFoundTitle")}</h2>
          <p className="text-muted-foreground text-sm">{t("errorsPage.notFoundBody")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="me-2 h-4 w-4" />
              {t("errorsPage.goHome")}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/reservations">
              <Home className="me-2 h-4 w-4" />
              {t("nav.dashboard")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

