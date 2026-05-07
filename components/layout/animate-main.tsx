"use client"

import { FadeIn } from "@/components/motion/motion-shell"

export function AnimateMain({ children }: { children: React.ReactNode }) {
  return <FadeIn>{children}</FadeIn>
}
