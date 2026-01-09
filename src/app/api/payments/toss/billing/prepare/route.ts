import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    // customerKey는 사용자 ID 기반으로 생성 (고유하고 안전하게)
    const customerKey = `CK_${session.user.id.replace(/-/g, '').substring(0, 20)}`

    // customerKey만 반환 (클라이언트에서 SDK 사용 예정)
    return NextResponse.json({
      customerKey,
    })
  } catch (error) {
    console.error("Billing prepare error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
