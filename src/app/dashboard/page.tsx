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
import { ConsultingChatbot } from "@/components/consulting-chatbot"

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

  // Format billing period end date
  const billingEndDate = policyInfo?.billingPeriodEnd
    ? `${policyInfo.billingPeriodEnd.getFullYear()}-${String(policyInfo.billingPeriodEnd.getMonth() + 1).padStart(2, '0')}-${String(policyInfo.billingPeriodEnd.getDate()).padStart(2, '0')}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <Link href="/">
              <h1 className="text-xl md:text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">AI-GFC</h1>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7 md:h-9 md:px-4 md:text-sm">관리</Button>
                </Link>
              )}
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7 md:h-9 md:px-4 md:text-sm">구독 관리</Button>
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-2xl font-bold">대시보드</h2>
          <span className="text-gray-500">|</span>
          <p className="text-gray-600">
            <span className="font-semibold text-blue-600">크레탑</span> 분석보고서, <span className="font-semibold text-blue-600">재무제표</span> 파일을 <span className="font-semibold text-blue-600">업로드</span> 하면 기업 컨설팅 <span className="font-semibold text-blue-600">AI 분석</span>을 해드립니다.
          </p>
        </div>

        {/* 메인 영역: 왼쪽 챗봇 + 오른쪽 (카드 + 프로젝트 목록) */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* 왼쪽: AI 챗봇 (전체 높이) */}
          <div className="h-[700px]">
            <ConsultingChatbot inline />
          </div>

          {/* 오른쪽: 카드들 + 프로젝트 목록 */}
          <div className="flex flex-col gap-4 h-[700px]">
            {/* 4개 카드 2x2 배치 */}
            <div className="grid grid-cols-2 gap-3 h-[180px] flex-shrink-0">
              <Card className="flex flex-col">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">구독 플랜</CardTitle>
                  <CardDescription className="text-xs">현재 사용 중인 플랜</CardDescription>
                </CardHeader>
                <CardContent className="py-2 px-3 flex-1">
                  <div className="text-xl font-bold">
                    {subscription?.plan === "expert" ? "Expert" : subscription?.plan === "pro" ? "Pro" : "Free"}
                  </div>
                  {groupName === 'free' ? (
                    <>
                      <p className="text-xs text-gray-500 mt-1">
                        매달 1일 초기화
                      </p>
                      <Link href="/pricing" className="text-xs text-blue-600 hover:underline">
                        업그레이드
                      </Link>
                    </>
                  ) : billingEndDate && (
                    <p className="text-xs text-gray-600 mt-1">
                      만료일: {billingEndDate}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">분석제안서 권한</CardTitle>
                  <CardDescription className="text-xs">이번 달 생성 횟수</CardDescription>
                </CardHeader>
                <CardContent className="py-2 px-3 flex-1">
                  <div className="text-xl font-bold">
                    {solutionLimit === 999999 ? (
                      <span className="text-green-600">무제한</span>
                    ) : (
                      <span className={solutionUsage >= solutionLimit ? "text-red-600" : "text-green-600"}>
                        {solutionLimit - solutionUsage} / {solutionLimit}
                      </span>
                    )}
                  </div>
                  {groupName === 'free' && solutionUsage >= solutionLimit && (
                    <Link href="/pricing" className="text-xs text-blue-600 hover:underline">
                      Pro로 업그레이드
                    </Link>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">비주얼 레포트 권한</CardTitle>
                  <CardDescription className="text-xs">이번 달 생성 횟수</CardDescription>
                </CardHeader>
                <CardContent className="py-2 px-3 flex-1">
                  <div className="text-xl font-bold">
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
                    <Link href="/pricing" className="text-xs text-blue-600 hover:underline">
                      Pro로 업그레이드
                    </Link>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">총 분석 건수</CardTitle>
                  <CardDescription className="text-xs">누적 생성 수</CardDescription>
                </CardHeader>
                <CardContent className="py-2 px-3 flex-1">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-600">분석제안서</p>
                      <div className="text-lg font-bold">{totalProjectCount}건</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-600">비주얼 레포트</p>
                      <div className="text-lg font-bold">{totalPresentationCount}건</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 기업분석 이력 */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4 flex-shrink-0">
                <div>
                  <CardTitle className="text-base">기업분석 이력</CardTitle>
                  <CardDescription className="text-xs">최근 생성한 분석 결과</CardDescription>
                </div>
                <Link href="/projects/new">
                  <Button size="sm" disabled={!canCreateProject}>
                    {canCreateProject ? "새 분석" : "초과"}
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto px-4 pb-4">
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-3 text-sm">아직 기업분석 내용이 없습니다</p>
                    <Link href="/projects/new">
                      <Button size="sm" disabled={!canCreateProject}>첫 분석 시작하기</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex flex-col p-3 border rounded-lg hover:bg-gray-50 gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm truncate">{project.companyName}</h3>
                            <p className="text-xs text-gray-500">
                              {new Date(project.createdAt).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
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
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          {project.status === "completed" && (
                            <>
                              <Link href={`/projects/${project.id}/library`}>
                                <Button variant="outline" size="sm" className="text-[10px] px-1.5 py-0.5 h-6">
                                  라이브러리
                                </Button>
                              </Link>
                              <Link href={`/projects/${project.id}/analysis`}>
                                <Button variant="outline" size="sm" className="text-[10px] px-1.5 py-0.5 h-6">
                                  분석제안서
                                </Button>
                              </Link>
                              <VisualReportButton
                                projectId={project.id}
                                hasReport={!!project.report?.pdfUrl}
                                remainingCount={remainingPresentations}
                              />
                              <Link href={`/projects/${project.id}/followup`}>
                                <Button variant="outline" size="sm" className="text-[10px] px-1.5 py-0.5 h-6 bg-green-50 text-green-700 border-green-300 hover:bg-green-100">
                                  후속 미팅
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
          </div>
        </div>

        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <AnnouncementsBanner />
          <CustomerServiceSection />
        </div>
      </main>

      <Footer />
    </div>
  )
}
