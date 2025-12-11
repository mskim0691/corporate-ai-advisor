"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

function SessionChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect to login if on a protected route and unauthenticated
    if (status === "unauthenticated") {
      // List of protected routes that require authentication
      const protectedRoutes = [
        '/dashboard',
        '/myinfo',
        '/projects',
        '/admin',
      ]

      // Check if current path starts with any protected route
      const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route))

      // Only redirect if on a protected route
      if (isProtectedRoute) {
        router.push("/auth/login")
      }
    }
  }, [status, router, pathname])

  return <>{children}</>
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionChecker>{children}</SessionChecker>
    </NextAuthSessionProvider>
  )
}
