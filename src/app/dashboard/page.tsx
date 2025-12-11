import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getCurrentYearMonth } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoutButton } from "@/components/logout-button"
import { DeleteProjectButton } from "@/components/delete-project-button"
import { AnnouncementsBanner } from "@/components/announcements-banner"

async function getUserDashboardData(userId: string) {
  const [user, subscription, usageLog, projects, totalProjectCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    }),
    prisma.subscription.findUnique({
      where: { userId },
    }),
    prisma.usageLog.findUnique({
      where: {
        userId_yearMonth: {
          userId,
          yearMonth: getCurrentYearMonth(),
        },
      },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: {
          select: { files: true },
        },
      },
    }),
    prisma.project.count({
      where: { userId },
    }),
  ])

  return { user, subscription, usageLog, projects, totalProjectCount }
}

async function getCreditPrices() {
  const prices = await prisma.creditPrice.findMany({
    where: {
      type: {
        in: ['basic_analysis', 'premium_presentation']
      }
    }
  })

  const basicPrice = prices.find(p => p.type === 'basic_analysis')
  const premiumPrice = prices.find(p => p.type === 'premium_presentation')

  return {
    basic: basicPrice?.credits || 10,
    premium: premiumPrice?.credits || 50
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  const [{ user, subscription, usageLog, projects, totalProjectCount }, creditPrices] = await Promise.all([
    getUserDashboardData(session.user.id),
    getCreditPrices()
  ])

  // Get user role
  const fullUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })
  const isAdmin = fullUser?.role === "admin"

  const isFreePlan = subscription?.plan === "free"
  const usageCount = usageLog?.count || 0
  const usageLimit = isFreePlan ? 2 : Infinity
  const canCreateProject = !isFreePlan || usageCount < usageLimit

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">AI-GFC</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/myinfo">
              <div className="text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors">
                {session.user.email}
              </div>
            </Link>
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline">관리</Button>
              </Link>
            )}
            <LogoutButton />
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

        <AnnouncementsBanner />

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/credit-history">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>보유 크레딧</CardTitle>
                <CardDescription>사용 가능한 크레딧</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{user?.credits || 0}</div>
                <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                  <p>기본 분석: {creditPrices.basic} 크레딧</p>
                  <p>고급 프레젠테이션: {creditPrices.premium} 크레딧</p>
                </div>
                <p className="text-xs text-blue-600 mt-2 hover:underline">내역 보기 →</p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>구독 플랜</CardTitle>
              <CardDescription>현재 사용 중인 플랜</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscription?.plan === "free" ? "Free" : "Pro"}
              </div>
              {isFreePlan && (
                <Link href="/pricing" className="text-sm text-blue-600 hover:underline">
                  Pro로 업그레이드
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>총 분석한 기업고객 수</CardTitle>
              <CardDescription>생성한 분석 프로젝트</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjectCount}</div>
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
                              컨설팅제안서
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
    </div>
  )
}
