"use client"

import React, { useEffect, useState } from "react"
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
  const [isAdmin, setIsAdmin] = useState(false)

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

    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/user/subscription')
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      } catch (err) {
        console.error('Failed to fetch user role:', err)
      }
    }

    fetchAnalysis()
    fetchUserRole()
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

  // Process markdown text - ensure ** patterns work correctly
  const processedText = React.useMemo(() => {
    if (!textAnalysis) return ""

    // Replace **'text'** with **text** (remove quotes inside bold markers)
    let processed = textAnalysis.replace(/\*\*'([^']+)'\*\*/g, '**$1**')

    // Replace **"text"** with **text** (remove double quotes inside bold markers)
    processed = processed.replace(/\*\*"([^"]+)"\*\*/g, '**$1**')

    // Debug logging
    if (typeof window !== 'undefined' && processed.includes('**')) {
      console.log('Markdown text contains ** patterns')
    }

    return processed
  }, [textAnalysis])

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
            <h1 className="text-2xl font-bold">{companyName} 경영컨설팅 분석 제안서</h1>
            <p className="text-sm text-gray-600">첨부된 파일을 바탕으로 맞춤형 솔루션을 제안합니다.</p>
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
              className="bg-gray-100"
              disabled
            >
              컨설팅제안서
            </Button>
            {isAdmin && (
              <Button
                onClick={handleGeneratePresentation}
                disabled={generatingPresentation}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {generatingPresentation ? "생성 중..." : analysisData ? "리포트" : "리포트 생성"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              대시보드
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 py-8" style={{ width: '80%' }}>

        <Card className="shadow-xl">
          <CardContent className="p-0 flex justify-center">
            <div className="bg-white rounded-lg" style={{ width: '95%' }}>
              <div
                className="prose prose-lg max-w-none p-8 md:p-12"
                style={{
                  fontFamily: "'Noto Sans KR', sans-serif"
                }}
              >
                <style jsx global>{`
                  .prose h1 {
                    color: #1e3a8a;
                    font-size: 2.25rem;
                    font-weight: 800;
                    margin-top: 3rem;
                    margin-bottom: 2rem;
                    padding: 1.5rem 0 1rem 0;
                    border-bottom: 4px solid #2563eb;
                    letter-spacing: -0.02em;
                    line-height: 1.3;
                  }

                  .prose h2 {
                    color: #1e40af;
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin-top: 2.5rem;
                    margin-bottom: 1.25rem;
                    padding: 1rem 0 0.75rem 1.25rem;
                    border-left: 5px solid #3b82f6;
                    line-height: 1.4;
                    background-color: #f0f9ff;
                    padding-right: 1rem;
                    border-radius: 0.25rem;
                  }

                  .prose h3 {
                    color: #2563eb;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    padding: 0.75rem 0 0.5rem 1rem;
                    border-left: 4px solid #60a5fa;
                    line-height: 1.4;
                    background-color: #eff6ff;
                    padding-right: 1rem;
                    border-radius: 0.25rem;
                  }

                  .prose h4 {
                    color: #1e40af;
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-top: 1.75rem;
                    margin-bottom: 0.875rem;
                    padding: 0.5rem 0 0.375rem 0.875rem;
                    border-left: 3px solid #93c5fd;
                    line-height: 1.5;
                  }

                  .prose h5 {
                    color: #3b82f6;
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    padding-left: 0.75rem;
                    border-left: 2px solid #bfdbfe;
                    line-height: 1.5;
                  }

                  .prose h6 {
                    color: #60a5fa;
                    font-size: 1rem;
                    font-weight: 600;
                    margin-top: 1.25rem;
                    margin-bottom: 0.625rem;
                    padding-left: 0.625rem;
                    border-left: 2px solid #dbeafe;
                    line-height: 1.6;
                  }

                  .prose p {
                    color: #374151;
                    line-height: 2;
                    margin-bottom: 1.5rem;
                    font-size: 1.05rem;
                    text-align: justify;
                    word-break: keep-all;
                  }

                  .prose ul, .prose ol {
                    margin-top: 1.25rem;
                    margin-bottom: 2rem;
                    padding-left: 2rem;
                    background-color: #f8fafc;
                    padding: 1.25rem 1.25rem 1.25rem 2.5rem;
                    border-radius: 0.5rem;
                    border-left: 4px solid #93c5fd;
                  }

                  .prose li {
                    color: #374151;
                    line-height: 2;
                    margin-bottom: 1rem;
                    font-size: 1.05rem;
                  }

                  .prose ul > li {
                    padding-left: 1rem;
                    position: relative;
                  }

                  .prose ul > li::marker {
                    color: #2563eb;
                    font-weight: 800;
                    font-size: 1.25rem;
                  }

                  .prose ol > li {
                    padding-left: 1rem;
                  }

                  .prose ol > li::marker {
                    color: #2563eb;
                    font-weight: 800;
                    font-size: 1.125rem;
                  }

                  .prose strong {
                    color: #1e40af;
                    font-weight: 800;
                  }

                  .prose em {
                    color: #475569;
                    font-style: italic;
                    font-weight: 600;
                    background-color: #f1f5f9;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                  }

                  .prose blockquote {
                    border-left: 6px solid #3b82f6;
                    padding: 1.5rem 2rem;
                    font-style: normal;
                    color: #1e40af;
                    background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
                    margin: 2.5rem 0;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
                    font-size: 1.125rem;
                    font-weight: 600;
                  }

                  .prose blockquote p {
                    margin-bottom: 0.75rem;
                  }

                  .prose blockquote p:last-child {
                    margin-bottom: 0;
                  }

                  .prose code {
                    background-color: #fee2e2;
                    color: #991b1b;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.375rem;
                    font-size: 0.9375rem;
                    font-weight: 600;
                    border: 1px solid #fecaca;
                  }

                  .prose pre {
                    background-color: #1e293b;
                    color: #e2e8f0;
                    padding: 1.5rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin: 2rem 0;
                  }

                  .prose pre code {
                    background-color: transparent;
                    color: inherit;
                    padding: 0;
                    border: none;
                    font-weight: normal;
                  }

                  .prose table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin: 2rem 0;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                  }

                  .prose th {
                    background: linear-gradient(to bottom, #dbeafe, #bfdbfe);
                    color: #1e3a8a;
                    font-weight: 700;
                    padding: 1rem;
                    text-align: left;
                    border: 1px solid #93c5fd;
                    font-size: 1rem;
                  }

                  .prose td {
                    padding: 1rem;
                    border: 1px solid #e5e7eb;
                    background-color: #ffffff;
                  }

                  .prose tr:nth-child(even) td {
                    background-color: #f9fafb;
                  }

                  .prose tr:hover td {
                    background-color: #f0f9ff;
                  }

                  .prose hr {
                    border: none;
                    border-top: 2px solid #e5e7eb;
                    margin: 3rem 0;
                  }

                  .prose a {
                    color: #2563eb;
                    text-decoration: underline;
                    font-weight: 500;
                    transition: color 0.2s;
                  }

                  .prose a:hover {
                    color: #1d4ed8;
                  }
                `}</style>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      const language = match ? match[1] : ''

                      if (language === 'mermaid') {
                        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
                      }

                      // Check if this is a code block (has language class) or inline code
                      const isCodeBlock = className && className.includes('language-')

                      // Convert inline code to bold text
                      if (!isCodeBlock) {
                        return <strong>{children}</strong>
                      }

                      // Keep code blocks as code
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                    strong({ node, children, ...props }) {
                      return <strong {...props}>{children}</strong>
                    }
                  }}
                >
                  {processedText}
                </ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>프린터 출력</CardTitle>
            <CardDescription>
              컨설팅 제안서를 프린터로 출력할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.print()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              🖨️ 프린터 출력
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
