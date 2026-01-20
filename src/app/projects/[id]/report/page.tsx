"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingVisualReport, setGeneratingVisualReport] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<string>("")
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    params.then(({ id }) => setProjectId(id))
  }, [params])

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.role === "admin")
        }
      } catch (error) {
        console.error("Failed to check admin status:", error)
      }
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    if (!projectId) return

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        const data = await response.json()

        if (!response.ok || data.status !== "completed") {
          // 분석이 완료되지 않았으면 비주얼 리포트 생성 시작
          if (data.report?.textAnalysis && !data.report?.pdfUrl) {
            setCompanyName(data.companyName)
            setLoading(false)
            await generateVisualReport()
            return
          }
          router.push(`/projects/${projectId}/processing`)
          return
        }

        setCompanyName(data.companyName)

        // PDF가 있으면 바로 보여주기
        if (data.report?.pdfUrl) {
          setPdfUrl(data.report.pdfUrl)
          setLoading(false)
          return
        }

        // PDF가 없으면 생성 시작
        setLoading(false)
        await generateVisualReport()
      } catch (error) {
        console.error("Failed to fetch project:", error)
        router.push("/dashboard")
      }
    }

    fetchProject()
  }, [projectId, router])

  const generateVisualReport = async () => {
    if (!projectId || generatingVisualReport) return

    setGeneratingVisualReport(true)
    setGenerationProgress("프레젠테이션 슬라이드 생성 중...")
    setGenerationError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/generate-visual-report`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        // 서버 과부하 에러인 경우 특별 처리
        if (response.status === 503) {
          setGenerationError(error.error || "현재 서버 과부하입니다. 나중에 다시 요청해주세요.")
          setGeneratingVisualReport(false)
          return
        }
        throw new Error(error.error || "비주얼 리포트 생성 실패")
      }

      const result = await response.json()
      setGenerationProgress("비주얼 리포트 생성 완료!")
      setPdfUrl(result.pdfUrl)
    } catch (error) {
      console.error("Visual report generation error:", error)
      const errorMessage = error instanceof Error ? error.message : "생성 중 오류가 발생했습니다."
      setGenerationError(errorMessage)
    } finally {
      setGeneratingVisualReport(false)
    }
  }

  const handleDeleteVisualReport = async () => {
    if (!projectId || deleting) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/delete-visual-report`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "비주얼 리포트 삭제 실패")
      }

      setPdfUrl(null)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Visual report deletion error:", error)
      alert("비주얼 리포트 삭제 중 오류가 발생했습니다.")
    } finally {
      setDeleting(false)
    }
  }

  // 에러 발생 시 에러 화면 표시
  if (generationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-6">{generationError}</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="px-6"
          >
            ← 뒤로 가기
          </Button>
        </div>
      </div>
    )
  }

  if (loading || generatingVisualReport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          {generatingVisualReport && (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-700">비주얼 리포트 생성 중...</p>
              <p className="text-sm text-gray-500">{generationProgress}</p>
              <p className="text-xs text-gray-400 mt-4">
                AI가 각 슬라이드를 이미지로 생성하고 있습니다.<br />
                이 작업은 몇 분 정도 소요될 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 min-w-0">
              <h1 className="text-lg md:text-2xl font-bold truncate">{companyName} 비주얼 리포트</h1>
              {isAdmin && pdfUrl && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleting}
                  className="text-xs px-2 py-1 h-7 md:h-8 md:px-3 w-fit"
                >
                  {deleting ? "삭제 중..." : "PDF 삭제"}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              <Button variant="outline" size="sm" asChild className="text-xs px-2 py-1 h-7 md:h-8 md:px-3">
                <Link href={`/projects/${projectId}/library`}>라이브러리</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs px-2 py-1 h-7 md:h-8 md:px-3">
                <Link href={`/projects/${projectId}/analysis`}>분석제안서</Link>
              </Button>
              <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7 md:h-8 md:px-3 bg-blue-100 text-blue-800 border-blue-300" disabled>
                비주얼 레포트
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs px-2 py-1 h-7 md:h-8 md:px-3 bg-green-50 text-green-700 border-green-300 hover:bg-green-100">
                <Link href={`/projects/${projectId}/followup`}>후속 미팅</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs px-2 py-1 h-7 md:h-8 md:px-3">
                <Link href="/dashboard">대시보드</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 면책 문구 */}
        <p className="text-xs text-gray-500 mb-4 text-center">
          본 자료는 영업 참고용이며, 정확한 금액 계산과 법률적 판단은 전문가와 상담하시기 바랍니다.
        </p>

        {pdfUrl ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full"
              style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}
              title="비주얼 리포트 PDF"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">비주얼 리포트가 아직 생성되지 않았습니다.</p>
            <Button onClick={generateVisualReport} disabled={generatingVisualReport}>
              비주얼 리포트 생성하기
            </Button>
          </div>
        )}
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비주얼 리포트 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 비주얼 리포트를 삭제하시겠습니까?<br />
              삭제된 PDF 파일은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVisualReport}
              disabled={deleting}
            >
              {deleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
