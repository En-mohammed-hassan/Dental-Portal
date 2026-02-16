import { AppNavbar } from "@/components/dashboard/app-navbar"

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,#fdf2f8,transparent_40%),radial-gradient(circle_at_top_right,#e0f2fe,transparent_40%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,#1f2937,transparent_40%),radial-gradient(circle_at_top_right,#1e1b4b,transparent_40%),linear-gradient(180deg,#0b1020_0%,#111827_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-size-[44px_44px] opacity-40" />
      <AppNavbar />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t bg-white/70 dark:bg-slate-950/45 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-2 px-4 py-4 text-center text-xs text-slate-600 dark:text-slate-400 sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <a
            className="hover:text-primary transition-colors underline-offset-4 hover:underline break-all sm:break-normal"
            href="https://www.mhd-hasan.site/"
            rel="noopener noreferrer"
            target="_blank"
          >
            https://www.mhd-hasan.site/
          </a>
          <p className="whitespace-nowrap">© 2026 Mhd Hassan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
