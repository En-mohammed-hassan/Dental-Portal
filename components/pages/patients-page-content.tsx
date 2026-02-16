import { PatientManagement } from "@/components/patients/patient-management"

export function PatientsPageContent() {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Patient Management</h2>
        <p className="text-muted-foreground text-sm">
          Add, edit, search and maintain your patient profiles.
        </p>
      </div>
      <PatientManagement />
    </section>
  )
}
