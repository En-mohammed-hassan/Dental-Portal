import { NextResponse } from "next/server"

import { prisma } from "@/lib/server/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const items = await prisma.serviceItem.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({ items })
}
