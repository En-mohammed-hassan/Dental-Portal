"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Calendar, Shield, Sparkles } from "lucide-react"

import { useSiteContent } from "@/components/marketing/site-content-context"
import { Button } from "@/components/ui/button"

const iconPool = [Shield, Calendar, Sparkles] as const

export function HomePage() {
  const site = useSiteContent()

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-200/50 via-transparent to-transparent dark:from-teal-900/30" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-200/30 blur-3xl dark:bg-fuchsia-900/20" />

        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {site.clinicName}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              {site.heroTitle}
            </h1>
            <p className="max-w-xl text-lg text-slate-600 dark:text-slate-300">{site.heroSubtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 rounded-full px-6 shadow-md transition hover:shadow-lg">
                <Link href="/book">
                  {site.homeCtaPrimary}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-slate-300/80 px-6 dark:border-slate-600">
                <Link href="/services">{site.homeCtaSecondary}</Link>
              </Button>
            </div>
            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              {site.homeFeatures.map((f, i) => {
                const Icon = iconPool[i % iconPool.length]
                return (
                  <div
                    key={`${f.title}-${i}`}
                    className="rounded-2xl border border-slate-200/80 bg-white/50 p-4 shadow-sm backdrop-blur transition hover:border-teal-200/80 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-teal-900/50"
                  >
                    <Icon className="mb-2 h-5 w-5 text-teal-600 dark:text-teal-400" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{f.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {f.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/40 bg-gradient-to-br from-teal-100 via-white to-fuchsia-100 shadow-2xl dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-teal-950"
          >
            {site.heroImageBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={site.heroImageBase64}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {site.homeHeroEmptyHint}
                </p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-6 text-left text-white">
              <p className="text-sm font-semibold">{site.homeImageCaptionTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/85">
                {site.homeImageCaptionSubtitle}
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
