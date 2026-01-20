import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getUserPolicyInfo } from "@/lib/policy"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteProjectButton } from "@/components/delete-project-button"
import { VisualReportButton } from "@/components/visual-report-button"
import { AnnouncementsBanner } from "@/components/announcements-banner"
import { CustomerServiceSection } from "@/components/customer-service-section"
import { UserMenu } from "@/components/user-menu"
import { Footer } from "@/components/footer"

async function getUserDashboardData(userId: string) {
  const [subscription, projects, totalProjectCount, totalPresentationCount] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: {
          select: { files: true },
        },
        report: {
          select: {
            pdfUrl: true,
          },
        },
      },
    }),
    prisma.project.count({
      where: { userId },
    }),
    prisma.report.count({
      where: {
        reportType: 'presentation',
        project: {
          userId,
        },
      },
    }),
  ])

  return { subscription, projects, totalProjectCount, totalPresentationCount }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  const { subscription, projects, totalProjectCount, totalPresentationCount } = await getUserDashboardData(session.user.id)

  // Get user role
  const fullUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })
  const isAdmin = fullUser?.role === "admin"

  // Get policy info (uses subscription billing cycle for Pro/Expert)
  const policyInfo = await getUserPolicyInfo(session.user.id)
  const groupName = policyInfo?.groupName ?? 'free'

  // Get limits and usage from policy info
  const solutionLimit = policyInfo?.monthlyLimit ?? 3
  const presentationLimit = policyInfo?.monthlyPresentationLimit ?? 0

  const solutionUsage = policyInfo?.currentUsage ?? 0
  const presentationUsage = policyInfo?.currentPresentationUsage ?? 0

  const canCreateProject = solutionUsage < solutionLimit
  const remainingPresentations = presentationLimit === 999999 ? 999999 : Math.max(0, presentationLimit - presentationUsage)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">AI-GFC</h1>
          </Link>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline">관리</Button>
              </Link>
            )}
            <Link href="/pricing">
              <Button variant="outline">구독 관리</Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">대시보드</h2>
          <p className="text-gray-700 text-lg">
            <span className="text-xl font-bold text-blue-600">크레탑</span> 분석보고서, <span className="text-xl font-bold text-blue-600">재무제표</span> 파일을 <span className="text-xl font-bold text-blue-600">업로드</span> 하면 기업 컨설팅 <span className="text-xl font-bold text-blue-600">AI 분석</span>을 해드립니다.
          </p>
        </div>

        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnnouncementsBanner />
          <CustomerServiceSection />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>구독 플랜</CardTitle>
              <CardDescription>현재 사용 중인 플랜</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscription?.plan === "expert" ? "Expert" : subscription?.plan === "pro" ? "Pro" : "Free"}
              </div>
              {groupName === 'free' && (
                <Link href="/pricing" className="text-sm text-blue-600 hover:underline">
                  업그레이드
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>이번 달 분석제안서 생성 권한</CardTitle>
              <CardDescription>분석제안서 생성 횟수</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {solutionLimit === 999999 ? (
                  <span className="text-green-600">무제한</span>
                ) : (
                  <span className={solutionUsage >= solutionLimit ? "text-red-600" : "text-green-600"}>
                    {solutionLimit - solutionUsage} / {solutionLimit}
                  </span>
                )}
              </div>
              {groupName === 'free' && solutionUsage >= solutionLimit && (
                <Link href="/pricing" className="text-sm text-blue-600 hover:underline">
                  Pro로 업그레이드
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>이번 달 비주얼 레포트 생성 권한</CardTitle>
              <CardDescription>비주얼 레포트 생성 횟수</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {presentationLimit === 999999 ? (
                  <span className="text-green-600">무제한</span>
                ) : presentationLimit === 0 ? (
                  <span className="text-gray-400">사용 불가</span>
                ) : (
                  <span className={presentationUsage >= presentationLimit ? "text-red-600" : "text-green-600"}>
                    {presentationLimit - presentationUsage} / {presentationLimit}
                  </span>
                )}
              </div>
              {groupName === 'free' && (
                <Link href="/pricing" className="text-sm text-blue-600 hover:underline">
                  Pro로 업그레이드
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>총 분석 건수</CardTitle>
              <CardDescription>누적 생성 수</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">분석제안서</p>
                  <div className="text-xl font-bold">{totalProjectCount}건</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">비주얼 레포트</p>
                  <div className="text-xl font-bold">{totalPresentationCount}건</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>기업분석 이력</CardTitle>
              <CardDescription>최근 생성한 분석 결과</CardDescription>
            </div>
            <Link href="/projects/new">
              <Button disabled={!canCreateProject}>
                {canCreateProject ? "새 분석 시작" : "사용량 초과"}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">아직 기업분석 내용이 없습니다</p>
                <Link href="/projects/new">
                  <Button disabled={!canCreateProject}>첫 분석 시작하기</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-semibold">{project.companyName}</h3>
                      <p className="text-sm text-gray-600">
                        {project.businessNumber} · {project.representative}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        파일 {project._count.files}개 · {" "}
                        {new Date(project.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          project.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : project.status === "processing"
                            ? "bg-blue-100 text-blue-800"
                            : project.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {project.status === "completed"
                          ? "완료"
                          : project.status === "processing"
                          ? "분석 중"
                          : project.status === "failed"
                          ? "실패"
                          : "대기"}
                      </span>
                      {project.status === "completed" && (
                        <>
                          <Link href={`/projects/${project.id}/library`}>
                            <Button variant="outline" size="sm">
                              라이브러리
                            </Button>
                          </Link>
                          <Link href={`/projects/${project.id}/analysis`}>
                            <Button variant="outline" size="sm">
                              분석제안서
                            </Button>
                          </Link>
                          <VisualReportButton
                            projectId={project.id}
                            hasReport={!!project.report?.pdfUrl}
                            remainingCount={remainingPresentations}
                          />
                          <Link href={`/projects/${project.id}/followup`}>
                            <Button variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100">
                              후속 미팅 대응
                            </Button>
                          </Link>
                        </>
                      )}
                      <DeleteProjectButton
                        projectId={project.id}
                        companyName={project.companyName}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
