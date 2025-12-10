"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

function SessionChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      // Session expired, redirect to login
      router.push("/auth/login")
    }
  }, [status, router])

  return <>{children}</>
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionChecker>{children}</SessionChecker>
    </NextAuthSessionProvider>
  )
}
