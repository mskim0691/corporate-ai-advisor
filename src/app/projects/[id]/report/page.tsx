"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingVisualReport, setGeneratingVisualReport] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<string>("")
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    params.then(({ id }) => setProjectId(id))
  }, [params])

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

    try {
      const response = await fetch(`/api/projects/${projectId}/generate-visual-report`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "비주얼 리포트 생성 실패")
      }

      const result = await response.json()
      setGenerationProgress("비주얼 리포트 생성 완료!")
      setPdfUrl(result.pdfUrl)
    } catch (error) {
      console.error("Visual report generation error:", error)
      setGenerationProgress("생성 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setGeneratingVisualReport(false)
    }
  }

  const handleDownload = async () => {
    if (!pdfUrl) return

    setDownloading(true)
    try {
      const response = await fetch(pdfUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${companyName}_비주얼리포트.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download error:", error)
      alert("다운로드 중 오류가 발생했습니다.")
    } finally {
      setDownloading(false)
    }
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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{companyName} 비주얼 리포트</h1>
            {pdfUrl && (
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {downloading ? "다운로드 중..." : "PDF 다운로드"}
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href={`/projects/${projectId}/library`}>라이브러리</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/projects/${projectId}/initial-risk`}>현황분석</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/projects/${projectId}/analysis`}>솔루션</Link>
            </Button>
            <Button variant="outline" className="bg-gray-100" disabled>
              리포트
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">대시보드</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
    </div>
  )
}
