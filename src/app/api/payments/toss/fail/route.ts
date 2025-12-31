import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const message = searchParams.get('message')
    const orderId = searchParams.get('orderId')

    // 결제 로그 업데이트 (실패 상태)
    if (orderId) {
      await prisma.paymentLog.updateMany({
        where: { transactionId: orderId },
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
