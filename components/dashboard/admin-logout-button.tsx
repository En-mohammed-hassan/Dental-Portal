"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  compact?: boolean
}

export function AdminLogoutButton({ compact = false }: Props) {
  const router = useRouter()
  const { t } = useTranslation("admin")

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/sign-in?mode=staff")
    router.refresh()
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void logout()}
      type="button"
      className={cn(compact && "h-8 w-8 shrink-0 px-0 sm:h-9 sm:w-auto sm:px-3")}
      aria-label={t("logout")}
    >
      {compact ? (
        <>
          <LogOut className="h-4 w-4 sm:hidden" aria-hidden />
          <span className="hidden sm:inline">{t("logout")}</span>
        </>
      ) : (
        t("logout")
      )}
    </Button>
  )
}
