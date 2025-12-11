import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { id } = await params

    // 프로젝트 확인
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        report: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            credits: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 })
    }

    // 이미 PDF 리포트가 있는지 확인
    if (project.report?.pdfUrl) {
      return NextResponse.json(
        { error: "이미 프레젠테이션이 생성되었습니다" },
        { status: 400 }
      )
    }

    // 프레젠테이션 가격 가져오기
    const presentationPrice = await prisma.creditPrice.findFirst({
      where: { type: "premium_presentation" },
    })

    if (!presentationPrice) {
      return NextResponse.json(
        { error: "가격 정보를 찾을 수 없습니다" },
        { status: 500 }
      )
    }

    const cost = presentationPrice.credits

    // 크레딧 확인
    if (project.user.credits < cost) {
      return NextResponse.json(
        { error: "크레딧이 부족합니다" },
        { status: 400 }
      )
    }

    // 크레딧 차감 및 트랜잭션 기록
    await prisma.$transaction([
      // 크레딧 차감
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          credits: {
            decrement: cost,
          },
        },
      }),
      // 트랜잭션 기록
      prisma.creditTransaction.create({
        data: {
          userId: session.user.id,
          amount: -cost,
          type: "presentation_cost",
          description: `고급 프레젠테이션 제작 요청: ${project.companyName}`,
          balanceAfter: project.user.credits - cost,
        },
      }),
    ])

    // TODO: 여기에서 admin/make-report 페이지로 데이터 전송하는 로직 추가
    // 실제로는 관리자가 확인할 수 있는 Queue나 Notification 시스템이 필요합니다
    // 현재는 프로젝트 정보만 반환합니다

    return NextResponse.json({
      success: true,
      message: "프레젠테이션 제작이 신청되었습니다",
      project: {
        id: project.id,
        companyName: project.companyName,
        representative: project.representative,
        userId: project.user.id,
        userEmail: project.user.email,
        userName: project.user.name,
      },
    })
  } catch (error) {
    console.error("Order report error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
