"use client"

import { useTranslation } from "react-i18next"

import { formatMoneyFromCents } from "@/lib/format"
import { type Locale } from "@/lib/locale"
import { cn } from "@/lib/utils"

type Props = {
  totalChargedCents?: number | null
  totalPaidCents?: number | null
  balanceDueCents?: number | null
  locale: Locale
  className?: string
  projectedBalanceCents?: number | null
}

export function PatientBillingPanel({
  totalChargedCents = 0,
  totalPaidCents = 0,
  balanceDueCents = 0,
  locale,
  className,
  projectedBalanceCents,
}: Props) {
  const { t } = useTranslation("admin")
  const total = totalChargedCents ?? 0
  const paid = totalPaidCents ?? 0
  // Match the charged/paid columns (profile balance can be 0 while visit totals are non-zero)
  const remainingFromTotals = Math.max(0, total - paid)
  const profileRemaining = balanceDueCents ?? 0
  const remaining =
    profileRemaining > 0 && profileRemaining !== remainingFromTotals
      ? profileRemaining
      : remainingFromTotals
  const projected = projectedBalanceCents ?? remaining

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/40",
        className
      )}
    >
      <p className="text-muted-foreground mb-2 text-xs font-medium">{t("billing.accountSummary")}</p>
      <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
        <div>
          <p className="text-muted-foreground text-[10px] sm:text-xs">{t("billing.totalCharged")}</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white sm:text-base">
            {formatMoneyFromCents(total, locale)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] sm:text-xs">{t("billing.totalPaid")}</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-base">
            {formatMoneyFromCents(paid, locale)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] sm:text-xs">{t("billing.remaining")}</p>
          <p
            className={cn(
              "mt-0.5 text-sm font-semibold tabular-nums sm:text-base",
              remaining > 0
                ? "text-amber-800 dark:text-amber-200"
                : "text-slate-700 dark:text-slate-300"
            )}
          >
            {formatMoneyFromCents(remaining, locale)}
          </p>
        </div>
      </div>
      {projectedBalanceCents != null && projected !== remaining && (
        <p className="text-muted-foreground mt-2 border-t border-slate-200/80 pt-2 text-xs dark:border-slate-700">
          {t("reservations.balanceAfterSession")}:{" "}
          <span className="font-semibold tabular-nums text-amber-900 dark:text-amber-100">
            {formatMoneyFromCents(projected, locale)}
          </span>
        </p>
      )}
    </div>
  )
}
