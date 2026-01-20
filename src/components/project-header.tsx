import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface ProjectHeaderProps {
  projectId: string
  companyName: string
  currentPage: "library" | "initial-risk" | "analysis" | "report" | "followup"
  subtitle?: string
  hasPdfReport?: boolean
}

export async function ProjectHeader({
  projectId,
  companyName,
  currentPage,
  subtitle,
  hasPdfReport = false
}: ProjectHeaderProps) {
  const session = await auth()

  // Get user role
  let isAdmin = false
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    isAdmin = user?.role === "admin"
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case "library": return "라이브러리"
      case "initial-risk": return "현황분석"
      case "analysis": return "분석제안서"
      case "report": return "비주얼 레포트"
      case "followup": return "후속 미팅 대응"
      default: return ""
    }
  }

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-3 md:py-4">
        {/* 모바일: 세로 배치, 데스크탑: 가로 배치 */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">{companyName} {getPageTitle()}</h1>
            {subtitle && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-2 py-1 h-7 md:h-8 md:px-3 ${currentPage === "library" ? "bg-gray-100" : ""}`}
              disabled={currentPage === "library"}
              asChild={currentPage !== "library"}
            >
              {currentPage === "library" ? (
                <span>라이브러리</span>
              ) : (
                <Link href={`/projects/${projectId}/library`}>라이브러리</Link>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-2 py-1 h-7 md:h-8 md:px-3 ${currentPage === "analysis" ? "bg-gray-100" : ""}`}
              disabled={currentPage === "analysis"}
              asChild={currentPage !== "analysis"}
            >
              {currentPage === "analysis" ? (
                <span>분석제안서</span>
              ) : (
                <Link href={`/projects/${projectId}/analysis`}>분석제안서</Link>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-2 py-1 h-7 md:h-8 md:px-3 ${currentPage === "report" ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"}`}
              disabled={currentPage === "report"}
              asChild={currentPage !== "report"}
            >
              {currentPage === "report" ? (
                <span>비주얼 레포트</span>
              ) : (
                <Link href={`/projects/${projectId}/report`}>비주얼 레포트</Link>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs px-2 py-1 h-7 md:h-8 md:px-3 ${currentPage === "followup" ? "bg-green-100 text-green-800 border-green-300" : "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"}`}
              disabled={currentPage === "followup"}
              asChild={currentPage !== "followup"}
            >
              {currentPage === "followup" ? (
                <span>후속 미팅</span>
              ) : (
                <Link href={`/projects/${projectId}/followup`}>후속 미팅</Link>
              )}
            </Button>
            <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7 md:h-8 md:px-3" asChild>
              <Link href="/dashboard">대시보드</Link>
            </Button>
            {isAdmin && (
              <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7 md:h-8 md:px-3" asChild>
                <Link href="/admin">관리</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
