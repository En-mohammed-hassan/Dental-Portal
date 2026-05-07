"use client"

import { createContext, useContext } from "react"

import { type PublicSite } from "@/types/public-site"

const SiteContentContext = createContext<PublicSite | null>(null)

export function SiteContentProvider({
  value,
  children,
}: {
  value: PublicSite
  children: React.ReactNode
}) {
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent(): PublicSite {
  const ctx = useContext(SiteContentContext)
  if (!ctx) {
    throw new Error("useSiteContent must be used within SiteContentProvider (marketing or patient shell)")
  }
  return ctx
}
