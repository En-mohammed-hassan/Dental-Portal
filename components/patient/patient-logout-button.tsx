"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function PatientLogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/sign-in?mode=patient")
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" type="button" onClick={() => void logout()}>
      Sign out
    </Button>
  )
}
