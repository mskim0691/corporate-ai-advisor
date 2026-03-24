import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  )
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  )

  // Rate limiting for sensitive endpoints
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const path = request.nextUrl.pathname

  if (isRateLimitedPath(path)) {
    const key = `${ip}:${path}`
    const now = Date.now()

    // Clean expired entries
    for (const [k, v] of rateLimitMap.entries()) {
      if (now - v.windowStart > WINDOW_MS) {
        rateLimitMap.delete(k)
      }
    }

    const entry = rateLimitMap.get(key)
    const limit = getLimit(path)

    if (entry) {
      if (now - entry.windowStart > WINDOW_MS) {
        rateLimitMap.set(key, { count: 1, windowStart: now })
      } else if (entry.count >= limit) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      } else {
        entry.count++
      }
    } else {
      rateLimitMap.set(key, { count: 1, windowStart: now })
    }
  }

  return response
}

// In-memory rate limit store (resets on cold start, suitable for serverless)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const WINDOW_MS = 60 * 1000 // 1 minute window

function isRateLimitedPath(path: string): boolean {
  return (
    path.startsWith("/api/auth/register") ||
    path.startsWith("/api/auth/callback") ||
    path.startsWith("/api/coupons/redeem") ||
    path.startsWith("/api/chat")
  )
}

function getLimit(path: string): number {
  if (path.startsWith("/api/auth/register")) return 5
  if (path.startsWith("/api/auth/callback")) return 10
  if (path.startsWith("/api/coupons/redeem")) return 5
  if (path.startsWith("/api/chat")) return 20
  return 30
}

export const config = {
  matcher: [
    // Apply to all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
