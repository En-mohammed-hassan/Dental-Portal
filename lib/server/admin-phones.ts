import { prisma } from "@/lib/server/db"

const SEEDED_ADMIN_PHONES = [
  { phone: "0967772427", label: "Owner Admin 1" },
  { phone: "0934937016", label: "Owner Admin 2" },
] as const

export async function ensureSeededAdminPhones(): Promise<void> {
  const model = (prisma as unknown as { adminPhone?: { upsert: Function } }).adminPhone
  if (!model?.upsert) {
    // Prisma client not regenerated/restarted yet; keep login working with static seed list.
    return
  }
  await Promise.all(
    SEEDED_ADMIN_PHONES.map((item) =>
      model.upsert({
        where: { phone: item.phone },
        create: { phone: item.phone, label: item.label },
        update: { label: item.label },
      })
    )
  )
}

export async function findAdminPhoneByCandidates(candidates: string[]): Promise<{ phone: string; label: string | null } | null> {
  const model = (prisma as unknown as { adminPhone?: { findFirst: Function } }).adminPhone
  if (!model?.findFirst) {
    const fallback = SEEDED_ADMIN_PHONES.find((p) => candidates.includes(p.phone))
    return fallback ? { phone: fallback.phone, label: fallback.label } : null
  }
  return (await model.findFirst({ where: { phone: { in: candidates } } })) as
    | { phone: string; label: string | null }
    | null
}

export async function findAdminPhoneExact(phone: string): Promise<{ phone: string; label: string | null } | null> {
  const model = (prisma as unknown as { adminPhone?: { findUnique: Function } }).adminPhone
  if (!model?.findUnique) {
    const fallback = SEEDED_ADMIN_PHONES.find((p) => p.phone === phone)
    return fallback ? { phone: fallback.phone, label: fallback.label } : null
  }
  return (await model.findUnique({ where: { phone } })) as { phone: string; label: string | null } | null
}

