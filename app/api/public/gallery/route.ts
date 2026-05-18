import { NextResponse } from "next/server"

import { localizeGalleryImage } from "@/lib/localized-content"
import { getServerLocale } from "@/lib/server/locale"
import { prisma } from "@/lib/server/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const locale = await getServerLocale()
  const images = await prisma.galleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 100,
  })
  return NextResponse.json({
    images: images.map((image) => localizeGalleryImage(image, locale)),
  })
}
