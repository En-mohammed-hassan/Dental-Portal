import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { SESSION_COOKIE } from "@/lib/auth/constants"
import { verifySessionToken } from "@/lib/auth/jwt"
import { LOCALE_COOKIE, localeFromAcceptLanguage } from "@/lib/locale"

function finish(request: NextRequest, response: NextResponse) {
  if (!request.cookies.get(LOCALE_COOKIE)?.value) {
    const locale = localeFromAcceptLanguage(request.headers.get("accept-language"))
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
  }
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null

  const isStaff = session?.role === "ADMIN" || session?.role === "SECRETARY"
  const isPatient = session?.role === "PATIENT"

  if (pathname === "/admin/login") {
    return finish(
      request,
      NextResponse.redirect(new URL("/sign-in?mode=staff", request.url))
    )
  }
  if (pathname.startsWith("/portal")) {
    if (pathname === "/portal/login" || pathname.startsWith("/portal/login/")) {
      return finish(
        request,
        NextResponse.redirect(new URL("/sign-in?mode=patient", request.url))
      )
    }
    if (pathname === "/portal/register" || pathname.startsWith("/portal/register/")) {
      return finish(
        request,
        NextResponse.redirect(new URL("/patient/register", request.url))
      )
    }
    const dest =
      pathname === "/portal" ? "/patient" : `/patient${pathname.slice("/portal".length)}`
    return finish(request, NextResponse.redirect(new URL(dest, request.url)))
  }

  if (pathname === "/sign-in" || pathname.startsWith("/sign-in/")) {
    if (isStaff) {
      return finish(
        request,
        NextResponse.redirect(new URL("/admin/reservations", request.url))
      )
    }
    if (isPatient) {
      return finish(request, NextResponse.redirect(new URL("/patient", request.url)))
    }
    return finish(request, NextResponse.next())
  }

  if (pathname.startsWith("/admin")) {
    if (isPatient) {
      return finish(request, NextResponse.redirect(new URL("/patient", request.url)))
    }
    if (!isStaff) {
      const url = new URL("/sign-in", request.url)
      url.searchParams.set("mode", "staff")
      url.searchParams.set("next", pathname + request.nextUrl.search)
      return finish(request, NextResponse.redirect(url))
    }
    return finish(request, NextResponse.next())
  }

  if (pathname.startsWith("/patient")) {
    const isPublic =
      pathname === "/patient/register" || pathname.startsWith("/patient/register/")
    if (isPublic) {
      return finish(request, NextResponse.next())
    }
    if (isStaff) {
      return finish(
        request,
        NextResponse.redirect(new URL("/admin/reservations", request.url))
      )
    }
    if (!isPatient) {
      const url = new URL("/sign-in", request.url)
      url.searchParams.set("mode", "patient")
      url.searchParams.set("next", pathname + request.nextUrl.search)
      return finish(request, NextResponse.redirect(url))
    }
    return finish(request, NextResponse.next())
  }

  return finish(request, NextResponse.next())
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
