import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

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
          updatedAt: true,
        },
      },
      _count: {
        select: {
          files: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc", // Sort by most recently updated (order time)
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

      {pendingProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            현재 대기 중인 비주얼 레포트 제작 요청이 없습니다
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{project.companyName}</CardTitle>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        신규 신청
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-semibold">대표자:</span> {project.representative}
                      </p>
                      <p>
                        <span className="font-semibold">사업자번호:</span>{" "}
                        {project.businessNumber || "미입력"}
                      </p>
                      {project.industry && (
                        <p>
                          <span className="font-semibold">업종:</span> {project.industry}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">
                      프로젝트 생성: {new Date(project.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                    {project.report?.updatedAt && (
                      <div className="text-sm font-semibold text-purple-600 mb-2">
                        신청 시간: {new Date(project.report.updatedAt).toLocaleString("ko-KR")}
                      </div>
                    )}
                    <Link
                      href={`/projects/${project.id}/analysis`}
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      분석 내용 보기
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 사용자 정보 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">요청 사용자 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">계정:</span>{" "}
                        <span className="font-medium">{project.user.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">이름:</span>{" "}
                        <span className="font-medium">{project.user.name || "미입력"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 추가 분석 요청 */}
                  {project.report?.additionalRequest && (
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                      <h3 className="font-semibold text-blue-900 mb-2">추가 분석 요청</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {project.report.additionalRequest}
                      </p>
                    </div>
                  )}

                  {/* 프로젝트 정보 */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>업로드된 파일: {project._count.files}개</span>
                    <Link
                      href={`/projects/${project.id}/library`}
                      className="text-blue-600 hover:underline"
                    >
                      파일 보기 →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
