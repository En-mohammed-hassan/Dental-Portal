import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { SESSION_COOKIE } from "@/lib/auth/constants"
import { verifySessionToken } from "@/lib/auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null

  const isStaff = session?.role === "ADMIN" || session?.role === "SECRETARY"
  const isPatient = session?.role === "PATIENT"

  // Legacy URLs → new routes (no auth)
  if (pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/sign-in?mode=staff", request.url))
  }
  if (pathname.startsWith("/portal")) {
    if (pathname === "/portal/login" || pathname.startsWith("/portal/login/")) {
      return NextResponse.redirect(new URL("/sign-in?mode=patient", request.url))
    }
    if (pathname === "/portal/register" || pathname.startsWith("/portal/register/")) {
      return NextResponse.redirect(new URL("/patient/register", request.url))
    }
    const dest =
      pathname === "/portal" ? "/patient" : `/patient${pathname.slice("/portal".length)}`
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Already signed in → skip sign-in page
  if (pathname === "/sign-in" || pathname.startsWith("/sign-in/")) {
    if (isStaff) {
      return NextResponse.redirect(new URL("/admin/reservations", request.url))
    }
    if (isPatient) {
      return NextResponse.redirect(new URL("/patient", request.url))
    }
    return NextResponse.next()
  }

  // Admin app — staff only (patients cannot browse admin)
  if (pathname.startsWith("/admin")) {
    if (isPatient) {
      return NextResponse.redirect(new URL("/patient", request.url))
    }
    if (!isStaff) {
      const url = new URL("/sign-in", request.url)
      url.searchParams.set("mode", "staff")
      url.searchParams.set("next", pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Patient app — patients only (staff cannot browse patient portal)
  if (pathname.startsWith("/patient")) {
    const isPublic =
      pathname === "/patient/register" || pathname.startsWith("/patient/register/")
    if (isPublic) {
      return NextResponse.next()
    }
    if (isStaff) {
      return NextResponse.redirect(new URL("/admin/reservations", request.url))
    }
    if (!isPatient) {
      const url = new URL("/sign-in", request.url)
      url.searchParams.set("mode", "patient")
      url.searchParams.set("next", pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/patient/:path*",
    "/sign-in",
    "/sign-in/:path*",
    "/portal",
    "/portal/:path*",
  ],
}
