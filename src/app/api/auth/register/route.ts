import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { notifyNewUserRegistration } from "@/lib/telegram"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "유효하지 않은 입력입니다." },
        { status: 400 }
      )
    }

    const { email, password, name } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      )
    }

    const passwordHash = await hash(password, 10)

    // Get initial credit policy
    const initialCreditPolicy = await prisma.initialCreditPolicy.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    const initialCredits = initialCreditPolicy?.credits || 0

    // Create user with initial credits
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        credits: initialCredits,
        subscription: {
          create: {
            plan: "free",
            status: "active",
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
      },
    })

    // Create credit transaction record if initial credits were granted
    if (initialCredits > 0) {
      await prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: initialCredits,
          type: 'initial_grant',
          description: '회원가입 축하 크레딧',
          balanceAfter: initialCredits,
        },
      })
    }

    // Send Telegram notification for new user registration
    try {
      await notifyNewUserRegistration({
        userName: user.name,
        userEmail: user.email,
        userId: user.id,
        credits: user.credits,
      })
    } catch (telegramError) {
      // Log error but don't fail registration if Telegram notification fails
      console.error('Failed to send Telegram notification:', telegramError)
    }

    return NextResponse.json(
      { user, message: "회원가입이 완료되었습니다." },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    })
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
