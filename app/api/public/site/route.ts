import { NextResponse } from "next/server"

import { getPublicSite } from "@/lib/server/public-site"

export const dynamic = "force-dynamic"

export async function GET() {
  const site = await getPublicSite()
  return NextResponse.json(site, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  })
}
