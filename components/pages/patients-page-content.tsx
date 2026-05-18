"use client"

import { useTranslation } from "react-i18next"

import { PatientManagement } from "@/components/patients/patient-management"

export function PatientsPageContent() {
  const { t } = useTranslation("admin")

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("patients.pageTitle")}</h2>
        <p className="text-muted-foreground text-sm">{t("patients.pageSubtitle")}</p>
      </div>
      <PatientManagement />
    </section>
  )
}
