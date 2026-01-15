import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Generate random alphanumeric code segment
function generateCodeSegment(length: number = 4): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate coupon code in format XXXX-XXXX-XXXX-XXXX
function generateCouponCode(): string {
  return `${generateCodeSegment()}-${generateCodeSegment()}-${generateCodeSegment()}-${generateCodeSegment()}`
}

// GET: List all coupons with pagination and filtering
export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status") // 'all', 'unused', 'used'
    const batchId = searchParams.get("batchId")

    const skip = (page - 1) * limit

    // Build filter
    const where: any = {}
    if (status === "unused") {
      where.redeemedBy = null
    } else if (status === "used") {
      where.redeemedBy = { not: null }
    }
    if (batchId) {
      where.batchId = batchId
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ])

    // Get unique batch IDs for filtering
    const batches = await prisma.coupon.groupBy({
      by: ["batchId"],
      _count: { id: true },
      where: { batchId: { not: null } },
      orderBy: { batchId: "desc" },
    })

    return NextResponse.json({
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      batches: batches.map((b) => ({
        batchId: b.batchId,
        count: b._count.id,
      })),
    })
  } catch (error) {
    console.error("Get coupons error:", error)
    return NextResponse.json(
      { error: "쿠폰 목록을 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// POST: Generate new coupons
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
    }

    const { count, plan = "pro", durationDays = 30, note } = await req.json()

    if (!count || count < 1 || count > 1000) {
      return NextResponse.json(
        { error: "생성 개수는 1~1000 사이여야 합니다" },
        { status: 400 }
      )
    }

    // Generate batch ID for grouping
    const batchId = `BATCH-${Date.now()}`

    // Generate unique coupon codes
    const coupons: { code: string; plan: string; durationDays: number; batchId: string; note: string | null }[] = []
    const existingCodes = new Set<string>()

    // Get existing codes from DB to avoid duplicates
    const existingInDb = await prisma.coupon.findMany({
      select: { code: true },
    })
    existingInDb.forEach((c) => existingCodes.add(c.code))

    for (let i = 0; i < count; i++) {
      let code: string
      let attempts = 0
      do {
        code = generateCouponCode()
        attempts++
        if (attempts > 100) {
          return NextResponse.json(
            { error: "쿠폰 코드 생성 중 오류가 발생했습니다" },
            { status: 500 }
          )
        }
      } while (existingCodes.has(code))

      existingCodes.add(code)
      coupons.push({
        code,
        plan,
        durationDays,
        batchId,
        note: note || null,
      })
    }

    // Bulk insert
    await prisma.coupon.createMany({
      data: coupons,
    })

    return NextResponse.json({
      success: true,
      message: `${count}개의 쿠폰이 생성되었습니다`,
      batchId,
      count,
      codes: coupons.map((c) => c.code),
    })
  } catch (error) {
    console.error("Create coupons error:", error)
    return NextResponse.json(
      { error: "쿠폰 생성 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// DELETE: Delete unused coupons
export async function DELETE(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
    }

    const { couponIds, batchId } = await req.json()

    if (batchId) {
      // Delete all unused coupons in a batch
      const result = await prisma.coupon.deleteMany({
        where: {
          batchId,
          redeemedBy: null,
        },
      })
      return NextResponse.json({
        success: true,
        message: `${result.count}개의 쿠폰이 삭제되었습니다`,
        deletedCount: result.count,
      })
    }

    if (couponIds && Array.isArray(couponIds)) {
      // Delete specific coupons (only unused ones)
      const result = await prisma.coupon.deleteMany({
        where: {
          id: { in: couponIds },
          redeemedBy: null,
        },
      })
      return NextResponse.json({
        success: true,
        message: `${result.count}개의 쿠폰이 삭제되었습니다`,
        deletedCount: result.count,
      })
    }

    return NextResponse.json(
      { error: "삭제할 쿠폰을 지정해주세요" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Delete coupons error:", error)
    return NextResponse.json(
      { error: "쿠폰 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
