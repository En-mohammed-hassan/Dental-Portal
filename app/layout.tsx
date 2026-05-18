import type { Metadata } from "next"
import { Inter, Noto_Sans_Arabic } from "next/font/google"
import { Toaster } from "react-hot-toast"

import { I18nProvider } from "@/components/providers/i18n-provider"
import { LocaleDocument } from "@/components/providers/locale-document"
import { ThemeProvider } from "@/components/theme-provider"
import { localeDir } from "@/lib/locale"
import { getServerLocale } from "@/lib/server/locale"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
})

export const metadata: Metadata = {
  title: "Clinic portal",
  description: "Online booking, patient portal, and staff dashboard.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getServerLocale()
  const dir = localeDir(locale)

  return (
    <html
      className={`${inter.variable} ${notoArabic.variable} h-full`}
      lang={locale}
      dir={dir}
      data-locale={locale}
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} min-h-screen ${locale === "ar" ? "font-arabic" : ""}`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.lang=${JSON.stringify(locale)};document.documentElement.dir=${JSON.stringify(dir)};document.documentElement.dataset.locale=${JSON.stringify(locale)};`,
          }}
        />
        <I18nProvider initialLocale={locale}>
          <LocaleDocument />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster position={dir === "rtl" ? "top-left" : "top-right"} />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
