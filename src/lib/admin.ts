import { auth } from "./auth"
import prisma from "./prisma"
import { NextResponse } from "next/server"

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth()

  if (!session?.user?.email) {
    return false
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  })

  return user?.role === "admin"
}

/**
 * Get current admin user or throw error
 */
export async function requireAdmin() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "인증이 필요합니다" },
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, role: true }
  })

  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "관리자 권한이 필요합니다" },
      { status: 403 }
    )
  }

  return { user }
}
