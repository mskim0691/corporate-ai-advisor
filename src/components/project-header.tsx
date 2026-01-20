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
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold break-words">{companyName} {getPageTitle()}</h1>
          {subtitle && <p className="text-xs md:text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`text-xs md:text-sm ${currentPage === "library" ? "bg-gray-100" : ""}`}
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
            className={`text-xs md:text-sm ${currentPage === "analysis" ? "bg-gray-100" : ""}`}
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
            className={`text-xs md:text-sm ${currentPage === "report" ? "bg-gray-100" : ""}`}
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
            className={`text-xs md:text-sm ${currentPage === "followup" ? "bg-gray-100" : ""}`}
            disabled={currentPage === "followup"}
            asChild={currentPage !== "followup"}
          >
            {currentPage === "followup" ? (
              <span>후속 미팅 대응</span>
            ) : (
              <Link href={`/projects/${projectId}/followup`}>후속 미팅 대응</Link>
            )}
          </Button>
          <Button variant="outline" size="sm" className="text-xs md:text-sm" asChild>
            <Link href="/dashboard">대시보드</Link>
          </Button>
          {isAdmin && (
            <Button variant="outline" size="sm" className="text-xs md:text-sm" asChild>
              <Link href="/admin">관리</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
