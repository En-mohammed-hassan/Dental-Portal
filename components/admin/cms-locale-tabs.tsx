"use client"

import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/lib/locale"

export function CmsLocaleTabs({
  value,
  onChange,
}: {
  value: Locale
  onChange: (locale: Locale) => void
}) {
  const { t } = useTranslation("admin")

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Locale)} dir={value === "ar" ? "rtl" : "ltr"}>
      <TabsList className="justify-start">
        <TabsTrigger value="en">{t("cms.english")}</TabsTrigger>
        <TabsTrigger value="ar">{t("cms.arabic")}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
