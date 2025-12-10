"use client"

import { signOut } from "next-auth/react"
import { Button } from "./ui/button"

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ redirect: false })
    window.location.href = "/"
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      로그아웃
    </Button>
  )
}
