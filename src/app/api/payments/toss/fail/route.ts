import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const message = searchParams.get('message')
    const orderId = searchParams.get('orderId')

    // 결제 로그 업데이트 (실패 상태) - 본인 소유 결제만 업데이트
    if (orderId) {
      await prisma.paymentLog.updateMany({
        where: {
          transactionId: orderId,
          userId: session.user.id,
          status: 'pending',
        },
        data: {
          status: 'failed',
        },
      })
    }

    // 실패 페이지로 리다이렉트
    const errorMessage = message || '결제가 취소되었습니다'
    return NextResponse.redirect(
      new URL(`/pricing?error=${code || 'payment_failed'}&message=${encodeURIComponent(errorMessage)}`, req.url)
    )
  } catch (error) {
    console.error("Payment fail callback error:", error)
    return NextResponse.redirect(new URL('/pricing?error=server_error', req.url))
  }
}
