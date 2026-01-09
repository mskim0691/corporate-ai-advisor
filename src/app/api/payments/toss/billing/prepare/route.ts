import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const clientKey = process.env.TOSS_CLIENT_KEY
    if (!clientKey) {
      return NextResponse.json({ error: "결제 설정 오류" }, { status: 500 })
    }

    // customerKey는 사용자 ID 기반으로 생성 (고유하고 안전하게)
    const customerKey = `CK_${session.user.id.replace(/-/g, '').substring(0, 20)}`

    return NextResponse.json({
      clientKey,
      customerKey,
      customerEmail: session.user.email,
      customerName: session.user.name || session.user.email,
    })
  } catch (error) {
    console.error("Billing prepare error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
