import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDashboard() {
  // Admin Dashboard with categorized menu - 2025-01-13
  // Fetch statistics
  const [
    totalUsers,
    totalProjects,
    totalPrompts,
    recentUsers,
    recentProjects,
    paymentStats
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.prompt.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        subscription: true,
        _count: {
          select: { projects: true }
        }
      }
    }),
    prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    }),
    prisma.paymentLog.aggregate({
      where: {
        status: 'completed'
      },
      _sum: {
        amount: true
      },
      _count: true
    })
  ])

  // Calculate this month's revenue
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const thisMonthRevenue = await prisma.paymentLog.aggregate({
    where: {
      status: 'completed',
      paidAt: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth
      }
    },
    _sum: {
      amount: true
    }
  })

  const totalRevenue = paymentStats._sum.amount || 0
  const monthRevenue = thisMonthRevenue._sum.amount || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="mt-2 text-sm text-gray-600">
          AI-GFC 관리 시스템에 오신 것을 환영합니다
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">총 회원 수</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">총 프로젝트</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{totalProjects}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">이번 달 매출</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                ₩{monthRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">총 매출</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                ₩{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 가입 회원</h2>
            <Link href="/admin/users" className="text-sm text-blue-600 hover:text-blue-700">
              전체 보기 →
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{user.name || '이름 없음'}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.subscription?.plan === 'pro' ? 'Pro' : 'Free'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user._count.projects}개 프로젝트
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Projects */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 분석제안서</h2>
            <Link href="/admin/projects" className="text-sm text-blue-600 hover:text-blue-700">
              전체 보기 →
            </Link>
          </div>
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{project.companyName}</p>
                  <p className="text-sm text-gray-600">{project.user.email}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    project.status === 'completed' ? 'text-green-600' :
                    project.status === 'processing' ? 'text-yellow-600' :
                    project.status === 'failed' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {project.status === 'completed' ? '완료' :
                     project.status === 'processing' ? '처리중' :
                     project.status === 'failed' ? '실패' : '대기'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Menu Sections */}
      <div className="space-y-8">
        {/* System Management Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">시스템 관리</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/projects"
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">프로젝트 관리</h3>
              <p className="text-sm text-gray-600">전체 프로젝트 현황을 확인합니다</p>
              <p className="mt-4 text-2xl font-bold text-green-600">{totalProjects}개</p>
            </Link>

            <Link
              href="/admin/prompts"
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">프롬프트 관리</h3>
              <p className="text-sm text-gray-600">AI 분석 프롬프트를 편집하고 관리합니다</p>
              <p className="mt-4 text-2xl font-bold text-blue-600">{totalPrompts}개</p>
            </Link>

            <Link
              href="/admin/revenue"
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-yellow-300 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">매출 통계</h3>
              <p className="text-sm text-gray-600">상세 매출 통계와 결제 내역을 확인합니다</p>
              <p className="mt-4 text-2xl font-bold text-yellow-600">{paymentStats._count}건</p>
            </Link>

            <Link
              href="/admin/make-report"
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">프레젠테이션 제작</h3>
              <p className="text-sm text-gray-600">고급 프레젠테이션 제작 대기 목록</p>
              <p className="mt-4 text-2xl font-bold text-orange-600">관리</p>
            </Link>

            <Link
              href="/admin/banners"
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">배너 관리</h3>
              <p className="text-sm text-gray-600">메인페이지 로테이션 배너를 관리합니다</p>
              <p className="mt-4 text-2xl font-bold text-teal-600">관리</p>
            </Link>
          </div>
        </div>

        {/* Member Management Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">회원</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/users"
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">회원 리스트</h3>
              <p className="text-sm text-gray-600">회원 정보와 구독 상태를 관리합니다</p>
              <p className="mt-4 text-2xl font-bold text-purple-600">{totalUsers}명</p>
            </Link>

            <Link
              href="/admin/policies"
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">그룹 정책</h3>
              <p className="text-sm text-gray-600">사용자 그룹별 정책을 설정합니다</p>
              <p className="mt-4 text-2xl font-bold text-indigo-600">설정</p>
            </Link>

            <Link
              href="/admin/pricing-plans"
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-pink-300 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">가격 플랜</h3>
              <p className="text-sm text-gray-600">서비스 가격 플랜을 관리합니다</p>
              <p className="mt-4 text-2xl font-bold text-pink-600">관리</p>
            </Link>

            {/* 크레딧 기능 비활성화
            <Link
              href="/admin/credit-prices"
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-cyan-300 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">크레딧 가격</h3>
              <p className="text-sm text-gray-600">크레딧 소비 가격을 설정합니다</p>
              <p className="mt-4 text-2xl font-bold text-cyan-600">설정</p>
            </Link>
            */}
          </div>
        </div>
      </div>
    </div>
  )
}
