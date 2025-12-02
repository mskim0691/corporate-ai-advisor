"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import rehypeRaw from "rehype-raw"
import { MermaidDiagram } from "@/components/mermaid-diagram"

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [textAnalysis, setTextAnalysis] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingPresentation, setGeneratingPresentation] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      setProjectId(id)
    })
  }, [params])

  useEffect(() => {
    if (!projectId) return

    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "데이터를 불러올 수 없습니다")
        }

        setTextAnalysis(data.report?.textAnalysis)
        setAnalysisData(data.report?.analysisData)
        setCompanyName(data.companyName)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [projectId])

  const handleGeneratePresentation = async () => {
    if (!projectId) return

    // 이미 프레젠테이션이 만들어져 있으면 바로 이동
    if (analysisData) {
      router.push(`/projects/${projectId}/report`)
      return
    }

    // 프레젠테이션이 없으면 새로 생성
    setGeneratingPresentation(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/generate-slides`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "프레젠테이션 생성에 실패했습니다")
      }

      router.push(`/projects/${projectId}/report`)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "프레젠테이션 생성 중 오류가 발생했습니다")
    } finally {
      setGeneratingPresentation(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">오류 발생</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/dashboard")}>대시보드로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{companyName} 기업 컨설팅 솔루션 제안</h1>
            <p className="text-sm text-gray-600">현황분석 결과를 바탕으로 맞춤형 솔루션을 제안합니다.</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/library`)}
            >
              라이브러리
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/initial-risk`)}
            >
              현황분석
            </Button>
            <Button
              variant="outline"
              className="bg-gray-100"
              disabled
            >
              솔루션
            </Button>
            <Button
              onClick={handleGeneratePresentation}
              disabled={generatingPresentation}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
            {generatingPresentation ? "생성 중..." : analysisData ? "리포트" : "리포트 생성"}
          </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              대시보드
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">

        <Card className="shadow-xl">
          <CardContent className="p-0">
            <div className="bg-white rounded-lg">
              <div
                className="prose prose-lg max-w-none p-8 md:p-12"
                style={{
                  fontFamily: "'Noto Sans KR', sans-serif"
                }}
              >
                <style jsx global>{`
                  .prose h2 {
                    color: #1e40af;
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-top: 2.5rem;
                    margin-bottom: 1.25rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 3px solid #3b82f6;
                  }

                  .prose h3 {
                    color: #1e3a8a;
                    font-size: 1.35rem;
                    font-weight: 600;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                  }

                  .prose h4 {
                    color: #1e40af;
                    font-size: 1.15rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                  }

                  .prose p {
                    color: #374151;
                    line-height: 1.8;
                    margin-bottom: 1rem;
                  }

                  .prose ul, .prose ol {
                    margin-top: 0.75rem;
                    margin-bottom: 1.5rem;
                  }

                  .prose li {
                    color: #374151;
                    line-height: 1.7;
                    margin-bottom: 0.5rem;
                  }

                  .prose strong {
                    color: #1f2937;
                    font-weight: 600;
                  }

                  .prose blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1rem;
                    font-style: italic;
                    color: #4b5563;
                  }

                  .prose code {
                    background-color: #f3f4f6;
                    padding: 0.2rem 0.4rem;
                    border-radius: 0.25rem;
                    font-size: 0.9em;
                    color: #dc2626;
                  }

                  .prose table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1.5rem 0;
                  }

                  .prose th {
                    background-color: #eff6ff;
                    color: #1e40af;
                    font-weight: 600;
                    padding: 0.75rem;
                    text-align: left;
                    border: 1px solid #dbeafe;
                  }

                  .prose td {
                    padding: 0.75rem;
                    border: 1px solid #e5e7eb;
                  }

                  .prose tr:nth-child(even) {
                    background-color: #f9fafb;
                  }
                `}</style>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      const isInline = !match
                      const language = match ? match[1] : ''

                      if (language === 'mermaid') {
                        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
                      }

                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {textAnalysis || ""}
                </ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>다음 단계</CardTitle>
            <CardDescription>
              {analysisData ? "이미 생성된 리포트를 확인하고 PDF로 다운로드할 수 있습니다" : "분석 결과를 보기 좋은 슬라이드 형식으로 변환하고 PDF로 다운로드할 수 있습니다"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGeneratePresentation}
              disabled={generatingPresentation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {generatingPresentation ? "리포트 생성 중..." : analysisData ? "📊 리포트 보기" : "📊 리포트 생성하기"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
