"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function AdminLogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/sign-in?mode=staff")
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void logout()} type="button">
      Sign out
    </Button>
  )
}
