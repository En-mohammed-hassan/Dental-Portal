import { NextResponse } from "next/server"

import { addCorsHeaders, handleCorsPreflight } from "@/lib/api/cors"
import { requireStaffApi } from "@/lib/api/require-staff"
import { listTreatmentHistoryPage } from "@/lib/server/reservations-service"

export const dynamic = "force-dynamic"

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request)
}

export async function GET(request: Request) {
  const denied = await requireStaffApi()
  if (denied) {
    return addCorsHeaders(denied, request)
  }

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1)
  const pageSize = Math.min(100, Math.max(5, parseInt(url.searchParams.get("pageSize") || "12", 10) || 12))
  const q = url.searchParams.get("q") ?? undefined
  const bookingType = url.searchParams.get("bookingType") ?? "all"
  const completedFrom = url.searchParams.get("completedFrom") ?? undefined
  const completedTo = url.searchParams.get("completedTo") ?? undefined

  const data = await listTreatmentHistoryPage({
    page,
    pageSize,
    q,
    bookingType:
      bookingType === "advance" || bookingType === "walk-in" || bookingType === "emergency"
        ? bookingType
        : "all",
    completedFrom,
    completedTo,
  })

  const response = NextResponse.json(
    { data },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    }
  )
  return addCorsHeaders(response, request)
}
