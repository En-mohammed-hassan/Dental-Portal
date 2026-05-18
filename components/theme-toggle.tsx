"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { t } = useTranslation("common")
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        aria-label={t("theme.toggle")}
        className="rounded-full"
        size="icon"
        type="button"
        variant="ghost"
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      aria-label={t("theme.toggle")}
      className="rounded-full"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      size="icon"
      type="button"
      variant="ghost"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
