import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface ProjectHeaderProps {
  projectId: string
  companyName: string
  currentPage: "library" | "initial-risk" | "analysis" | "report"
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

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{companyName} {currentPage === "library" ? "라이브러리" : currentPage === "initial-risk" ? "현황분석" : currentPage === "analysis" ? "솔루션" : "리포트"}</h1>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className={currentPage === "library" ? "bg-gray-100" : ""}
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
            className={currentPage === "analysis" ? "bg-gray-100" : ""}
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
            className={currentPage === "report" ? "bg-gray-100" : ""}
            disabled={currentPage === "report"}
            asChild={currentPage !== "report"}
          >
            {currentPage === "report" ? (
              <span>{hasPdfReport ? "비주얼 레포트 보기" : "비주얼 레포트 생성"}</span>
            ) : (
              <Link href={`/projects/${projectId}/report`}>
                {hasPdfReport ? "비주얼 레포트 보기" : "비주얼 레포트 생성"}
              </Link>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">대시보드</Link>
          </Button>
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href="/admin">관리</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
