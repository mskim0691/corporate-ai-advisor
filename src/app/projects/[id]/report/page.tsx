"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SlideViewer } from "@/components/slide-viewer"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface Slide {
  slideNumber: number
  title: string
  content: string
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [project, setProject] = useState<{
    companyName: string
    businessNumber: string
    slides: Slide[]
  } | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingVisualReport, setGeneratingVisualReport] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<string>("")

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
            setLoading(false)
            await generateVisualReport()
            return
          }
          router.push(`/projects/${projectId}/processing`)
          return
        }

        const analysisData = JSON.parse(data.report?.analysisData || '{"slides":[]}')

        // 슬라이드가 없고 PDF도 없으면 비주얼 리포트 생성
        if ((!analysisData.slides || analysisData.slides.length === 0) && !data.report?.pdfUrl) {
          setProject({
            companyName: data.companyName,
            businessNumber: data.businessNumber,
            slides: []
          })
          setLoading(false)
          await generateVisualReport()
          return
        }

        setProject({
          companyName: data.companyName,
          businessNumber: data.businessNumber,
          slides: analysisData.slides || []
        })
        setPdfUrl(data.report?.pdfUrl || null)
      } catch (error) {
        console.error("Failed to fetch project:", error)
        router.push("/dashboard")
      } finally {
        setLoading(false)
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

      // 페이지 새로고침하여 최신 데이터 로드
      window.location.reload()
    } catch (error) {
      console.error("Visual report generation error:", error)
      setGenerationProgress("생성 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setGeneratingVisualReport(false)
    }
  }

  const generatePDF = async () => {
    if (!project || !projectId) return

    setGenerating(true)
    try {
      // If PDF already exists, download it from server
      if (pdfUrl) {
        const response = await fetch(`/${pdfUrl}`)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project.companyName}_프레젠테이션.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        return
      }

      // Generate PDF from slides using html2canvas
      const A4_WIDTH = 841.89
      const A4_HEIGHT = 595.28

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      })

      const slideElements = document.querySelectorAll('[data-slide-index]')

      for (let i = 0; i < slideElements.length; i++) {
        const slideElement = slideElements[i] as HTMLElement

        const canvas = await html2canvas(slideElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        })

        const imgData = canvas.toDataURL('image/png')
        const imgAspectRatio = canvas.height / canvas.width

        let imgWidth = A4_WIDTH
        let imgHeight = A4_WIDTH * imgAspectRatio

        if (imgHeight > A4_HEIGHT) {
          imgHeight = A4_HEIGHT
          imgWidth = A4_HEIGHT / imgAspectRatio
        }

        const xOffset = (A4_WIDTH - imgWidth) / 2
        const yOffset = 0

        if (i > 0) {
          pdf.addPage('a4', 'landscape')
        }

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight)
      }

      // Convert PDF to blob
      const pdfBlob = pdf.output('blob')

      // Upload PDF to server
      const formData = new FormData()
      formData.append('pdf', pdfBlob, 'report.pdf')

      const uploadResponse = await fetch(`/api/projects/${projectId}/pdf/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('PDF 업로드 실패')
      }

      const { pdfUrl: newPdfUrl } = await uploadResponse.json()
      setPdfUrl(newPdfUrl)

      // Download the generated PDF
      pdf.save(`${project.companyName}_프레젠테이션.pdf`)
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      alert('PDF 생성 중 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
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

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{project.companyName} 컨설팅 리포트</h1>
            <Button onClick={generatePDF} disabled={generating} className="bg-blue-600 hover:bg-blue-700 text-white">
              {generating ? '생성 중...' : 'PDF 다운로드'}
            </Button>
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
        <SlideViewer slides={project.slides} />
      </main>
    </div>
  )
}
