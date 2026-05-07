import { NextResponse } from "next/server"

import { prisma } from "@/lib/server/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const images = await prisma.galleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 100,
  })
  return NextResponse.json({ images })
}
