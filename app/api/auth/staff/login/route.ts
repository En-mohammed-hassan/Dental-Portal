import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  void request
  return NextResponse.json(
    { message: "Password staff login has been removed. Use OTP login at /sign-in." },
    { status: 410 }
  )
}
