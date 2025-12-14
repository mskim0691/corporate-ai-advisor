import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { MakeReportClient } from "./make-report-client"

export default async function MakeReportPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== "admin") {
    redirect("/dashboard")
  }

  // Get all projects that requested presentation (visual report) but no PDF yet
  const pendingProjects = await prisma.project.findMany({
    where: {
      status: "completed",
      report: {
        reportType: "presentation", // Only show presentation requests
        textAnalysis: {
          not: null,
        },
        pdfUrl: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      report: {
        select: {
          id: true,
          reportType: true,
          additionalRequest: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          files: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc", // Sort by most recently created
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">비주얼 레포트 제작 대기 목록</h1>
        <p className="mt-2 text-sm text-gray-600">
          비주얼 레포트 제작이 신청된 프로젝트 목록입니다
        </p>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">대기 중인 신청</p>
              <p className="text-3xl font-bold text-purple-700 mt-1">{pendingProjects.length}건</p>
            </div>
            <div className="text-5xl">📊</div>
          </div>
        </CardContent>
      </Card>

      <MakeReportClient initialProjects={pendingProjects} />
    </div>
  )
}
