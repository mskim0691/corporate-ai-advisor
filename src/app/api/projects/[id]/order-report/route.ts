import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { checkPresentationCreationPolicy } from "@/lib/policy"
import { notifyVisualReportOrder } from "@/lib/telegram"

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
            role: true,
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

    // Get user subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    // Check PT report creation policy
    const policyCheck = await checkPresentationCreationPolicy(
      session.user.id,
      project.user.role,
      subscription?.plan
    )

    if (!policyCheck.allowed) {
      return NextResponse.json(
        { error: policyCheck.message || "PT레포트 생성 제한을 초과했습니다" },
        { status: 403 }
      )
    }

    // Update report to mark as presentation type
    if (project.report) {
      await prisma.report.update({
        where: { id: project.report.id },
        data: { reportType: 'presentation' },
      })
    } else {
      // Create a report if it doesn't exist (shouldn't happen, but just in case)
      await prisma.report.create({
        data: {
          projectId: project.id,
          reportType: 'presentation',
        },
      })
    }

    // Send Telegram notification to admin
    try {
      await notifyVisualReportOrder({
        userName: project.user.name || '이름 없음',
        userEmail: project.user.email,
        projectId: project.id,
        companyName: project.companyName,
        industry: project.industry || undefined,
      });
    } catch (telegramError) {
      // Log but don't fail the request if Telegram notification fails
      console.error('Telegram notification failed:', telegramError);
    }

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
