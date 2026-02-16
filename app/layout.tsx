import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dentist Appointment Management",
  description: "Reservation dashboard for current, waiting, and upcoming patients",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className="h-full" lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
              },
              success: {
                iconTheme: {
                  primary: "hsl(var(--primary))",
                  secondary: "hsl(var(--primary-foreground))",
                },
              },
              error: {
                iconTheme: {
                  primary: "hsl(0, 84.2%, 60.2%)",
                  secondary: "#fff",
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
