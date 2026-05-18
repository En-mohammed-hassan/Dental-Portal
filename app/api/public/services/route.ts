import { NextResponse } from "next/server"

import { localizeService } from "@/lib/localized-content"
import { getServerLocale } from "@/lib/server/locale"
import { prisma } from "@/lib/server/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const locale = await getServerLocale()
  const items = await prisma.serviceItem.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({
    items: items.map((item) => localizeService(item, locale)),
  })
}
