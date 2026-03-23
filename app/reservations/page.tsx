import { redirect } from "next/navigation"

/** Legacy URL — dashboard moved under /admin */
export default function LegacyReservationsRedirect() {
  redirect("/admin/reservations")
}
