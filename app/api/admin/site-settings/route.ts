import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireStaffApi } from "@/lib/api/require-staff"
import { normalizeMarketingContent } from "@/lib/marketing-content"
import { ensureSiteSettings } from "@/lib/server/site-settings"
import { prisma } from "@/lib/server/db"
import { formatZodIssues } from "@/lib/zod-errors"
import { optionalStoredImageSchema } from "@/lib/validation/stored-image"
import { marketingContentSchema } from "@/types/public-site"

export const dynamic = "force-dynamic"

const putSchema = z.object({
  clinicName: z.string().min(1).optional(),
  clinicNameAr: z.string().nullable().optional(),
  heroTitle: z.string().min(1).optional(),
  heroTitleAr: z.string().nullable().optional(),
  heroSubtitle: z.string().min(1).optional(),
  heroSubtitleAr: z.string().nullable().optional(),
  heroImageBase64: optionalStoredImageSchema,
  aboutMarkdown: z.string().nullable().optional(),
  aboutMarkdownAr: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  facebookUrl: z.string().url().nullable().optional(),
  instagramUrl: z.string().url().nullable().optional(),
  address: z.string().nullable().optional(),
  addressAr: z.string().nullable().optional(),
  footerNote: z.string().nullable().optional(),
  footerNoteAr: z.string().nullable().optional(),
  marketingContent: z.unknown().optional(),
})

export async function GET() {
  const denied = await requireStaffApi()
  if (denied) {
    return denied
  }
  await ensureSiteSettings()
  const site = await prisma.siteSettings.findUniqueOrThrow({ where: { id: "default" } })
  return NextResponse.json({
    site: {
      ...site,
      marketingContent: normalizeMarketingContent(site.marketingContent),
    },
  })
}

export async function PUT(request: Request) {
  try {
    const denied = await requireStaffApi()
    if (denied) {
      return denied
    }
    await ensureSiteSettings()
    const json = await request.json().catch(() => ({}))
    const parsed = putSchema.safeParse(json)
    if (!parsed.success) {
      const { message, issues } = formatZodIssues(parsed.error)
      return NextResponse.json({ message, issues }, { status: 400 })
    }
    const raw = parsed.data
    const { marketingContent: mcRaw, ...rest } = raw
    let marketingContent: Record<string, unknown> | undefined
    if (mcRaw !== undefined) {
      const mcParsed = marketingContentSchema.safeParse(mcRaw)
      if (!mcParsed.success) {
        const { message, issues } = formatZodIssues(mcParsed.error)
        return NextResponse.json({ message, issues }, { status: 400 })
      }
      marketingContent = mcParsed.data as Record<string, unknown>
    }

    const site = await prisma.siteSettings.update({
      where: { id: "default" },
      data: {
        ...rest,
        heroImageBase64:
          raw.heroImageBase64 === undefined
            ? undefined
            : raw.heroImageBase64 === "" || raw.heroImageBase64 == null
              ? null
              : raw.heroImageBase64,
        ...(marketingContent !== undefined
          ? { marketingContent: marketingContent as Prisma.InputJsonValue }
          : {}),
      },
    })
    return NextResponse.json({
      site: {
        ...site,
        marketingContent: normalizeMarketingContent(site.marketingContent),
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed"
    return NextResponse.json({ message }, { status: 500 })
  }
}
