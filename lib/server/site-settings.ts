import { prisma } from "./db"

export async function ensureSiteSettings() {
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      clinicName: "Elkood Dental",
      heroTitle: "Smile with confidence",
      heroSubtitle: "Modern dentistry, gentle care.",
    },
    update: {},
  })
}
