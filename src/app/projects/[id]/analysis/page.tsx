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
  const [companyName, setCompanyName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showMarkdown, setShowMarkdown] = useState(false)
  const [hasPdfReport, setHasPdfReport] = useState(false)
  const [canCreatePresentation, setCanCreatePresentation] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)

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
        setCompanyName(data.companyName)
        setHasPdfReport(!!data.report?.pdfUrl)
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
        setIsAdmin(data.role === 'admin')
      } catch (err) {
        console.error('Failed to fetch user role:', err)
      }
    }

    const fetchPolicyInfo = async () => {
      try {
        const response = await fetch('/api/user/policy')
        const data = await response.json()
        // Check if user has remaining presentation quota
        // Admin always can create, or if remaining presentation count > 0
        const canCreate = data.groupName === 'admin' || data.remainingPresentation > 0
        setCanCreatePresentation(canCreate)
      } catch (err) {
        console.error('Failed to fetch policy info:', err)
      }
    }

    fetchAnalysis()
    fetchUserRole()
    fetchPolicyInfo()
  }, [projectId])

  const handlePresentationClick = () => {
    if (!projectId) return

    // PDF 리포트가 있든 없든 report 페이지로 이동
    router.push(`/projects/${projectId}/report`)
  }

  const handleCopyToClipboard = async () => {
    if (!textAnalysis) return

    try {
      await navigator.clipboard.writeText(textAnalysis)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
      alert('클립보드 복사에 실패했습니다')
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
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-bold break-words">{companyName} 경영컨설팅 분석 제안서</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">첨부된 파일을 바탕으로 맞춤형 솔루션을 제안합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/library`)}
              className="text-xs md:text-sm"
            >
              라이브러리
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-100 text-xs md:text-sm"
              disabled
            >
              분석제안서
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMarkdown(!showMarkdown)}
                  className={`text-xs md:text-sm ${showMarkdown ? "bg-green-100 text-green-800 border-green-300" : ""}`}
                >
                  {showMarkdown ? "렌더링 보기" : "마크다운 보기"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  className={`text-xs md:text-sm ${copySuccess ? "bg-blue-100 text-blue-800 border-blue-300" : ""}`}
                >
                  {copySuccess ? "✓ 복사완료" : "📋 클립보드 복사"}
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={handlePresentationClick}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs md:text-sm"
              disabled={!hasPdfReport && !canCreatePresentation}
            >
              {hasPdfReport ? "비주얼 레포트 보기" : "비주얼 레포트 생성"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/followup`)}
              className="text-xs md:text-sm bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
            >
              후속 미팅 대응
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-xs md:text-sm"
            >
              대시보드
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto px-2 md:px-4 py-4 md:py-8 w-full md:w-11/12 lg:w-4/5 xl:w-3/4">
        {/* 면책 문구 */}
        <p className="text-xs text-gray-500 mb-4 text-center">
          본 자료는 영업 참고용이며, 정확한 금액 계산과 법률적 판단은 전문가와 상담하시기 바랍니다.
        </p>

        <Card className="shadow-xl">
          <CardContent className="p-0 flex justify-center">
            {showMarkdown ? (
              <div className="bg-white rounded-lg w-full p-4 md:p-8">
                <pre className="whitespace-pre-wrap font-mono text-xs md:text-sm bg-gray-50 p-4 md:p-6 rounded-lg overflow-auto max-h-screen border border-gray-200">
                  {processedText}
                </pre>
              </div>
            ) : (
              <div className="bg-white rounded-lg w-full">
                <div
                  className="prose prose-sm md:prose-lg max-w-none p-4 md:p-8 lg:p-12"
                  style={{
                    fontFamily: "'Noto Sans KR', sans-serif"
                  }}
                >
                <style jsx global>{`
                  .prose h1 {
                    color: #0f172a;
                    font-size: 2.5rem;
                    font-weight: 900;
                    margin-top: 3.5rem;
                    margin-bottom: 2.5rem;
                    padding: 2rem 0 1.5rem 0;
                    border-bottom: 6px solid #1e40af;
                    letter-spacing: -0.03em;
                    line-height: 1.2;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                  }

                  .prose h2 {
                    color: #ffffff;
                    font-size: 2.125rem;
                    font-weight: 900;
                    margin-top: 4rem;
                    margin-bottom: 2rem;
                    padding: 1.75rem 2rem;
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                    border-radius: 0.5rem;
                    line-height: 1.3;
                    box-shadow: 0 4px 6px rgba(30, 64, 175, 0.2);
                    letter-spacing: -0.02em;
                  }

                  .prose h3 {
                    color: #1e40af;
                    font-size: 1.625rem;
                    font-weight: 800;
                    margin-top: 2.5rem;
                    margin-bottom: 1.25rem;
                    padding: 1rem 1.5rem;
                    border-left: 6px solid #3b82f6;
                    background: linear-gradient(to right, #eff6ff 0%, #ffffff 100%);
                    line-height: 1.4;
                    border-radius: 0.375rem;
                    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
                  }

                  .prose h4 {
                    color: #1e40af;
                    font-size: 1.375rem;
                    font-weight: 700;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    padding: 0.75rem 0 0.5rem 1.25rem;
                    border-left: 4px solid #60a5fa;
                    line-height: 1.5;
                    background-color: #f8fafc;
                    border-radius: 0.25rem;
                  }

                  .prose h5 {
                    color: #3b82f6;
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-top: 1.75rem;
                    margin-bottom: 0.875rem;
                    padding-left: 1rem;
                    border-left: 3px solid #93c5fd;
                    line-height: 1.5;
                  }

                  .prose h6 {
                    color: #60a5fa;
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    padding-left: 0.875rem;
                    border-left: 2px solid #bfdbfe;
                    line-height: 1.6;
                  }

                  .prose p {
                    color: #1f2937;
                    line-height: 2;
                    margin-bottom: 2rem;
                    font-size: 1.0625rem;
                    text-align: justify;
                    word-break: keep-all;
                    letter-spacing: -0.01em;
                  }

                  .prose ul, .prose ol {
                    margin-top: 1.5rem;
                    margin-bottom: 2.5rem;
                    padding: 1.75rem 1.5rem 1.75rem 3rem;
                    background: linear-gradient(to right, #f8fafc 0%, #ffffff 100%);
                    border-radius: 0.75rem;
                    border-left: 5px solid #3b82f6;
                    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.08);
                  }

                  .prose li {
                    color: #1f2937;
                    line-height: 2.2;
                    margin-bottom: 1.25rem;
                    font-size: 1.0625rem;
                    letter-spacing: -0.01em;
                  }

                  .prose ul > li {
                    padding-left: 1.5rem;
                    position: relative;
                  }

                  .prose ul > li::marker {
                    color: #1e40af;
                    font-weight: 900;
                    font-size: 1.5rem;
                  }

                  .prose ol > li {
                    padding-left: 1.5rem;
                  }

                  .prose ol > li::marker {
                    color: #1e40af;
                    font-weight: 900;
                    font-size: 1.25rem;
                  }

                  .prose strong {
                    color: #000000;
                    font-weight: 900;
                    background: linear-gradient(to right, #fef08a 0%, #fde047 100%);
                    padding: 0.125rem 0.5rem;
                    border-radius: 0.25rem;
                    box-shadow: 0 1px 2px rgba(234, 179, 8, 0.2);
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
                    padding: 2rem 2.5rem;
                    font-style: normal;
                    color: #1e40af;
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                    margin: 3rem 0;
                    border-radius: 1rem;
                    font-size: 1.125rem;
                    font-weight: 600;
                    line-height: 2;
                  }

                  .prose blockquote p {
                    margin-bottom: 1rem;
                  }

                  .prose blockquote p:last-child {
                    margin-bottom: 0;
                  }

                  .prose code {
                    background-color: #fee2e2;
                    color: #991b1b;
                    padding: 0.3rem 0.6rem;
                    border-radius: 0.375rem;
                    font-size: 0.9375rem;
                    font-weight: 600;
                    border: 1px solid #fca5a5;
                    box-shadow: 0 1px 2px rgba(220, 38, 38, 0.1);
                  }

                  .prose pre {
                    background-color: #1e293b;
                    color: #e2e8f0;
                    padding: 2rem;
                    border-radius: 0.75rem;
                    overflow-x: auto;
                    margin: 2.5rem 0;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                    border: 1px solid #334155;
                  }

                  .prose pre code {
                    background-color: transparent;
                    color: inherit;
                    padding: 0;
                    border: none;
                    font-weight: normal;
                    box-shadow: none;
                  }

                  .prose table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin: 2.5rem 0;
                    border-radius: 0.75rem;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                  }

                  .prose th {
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                    color: #ffffff;
                    font-weight: 800;
                    padding: 1.25rem 1.5rem;
                    text-align: left;
                    border: none;
                    font-size: 1.0625rem;
                    letter-spacing: -0.01em;
                  }

                  .prose td {
                    padding: 1.25rem 1.5rem;
                    border: 1px solid #e5e7eb;
                    background-color: #ffffff;
                    font-size: 1rem;
                    transition: background-color 0.2s ease;
                  }

                  .prose tr:nth-child(even) td {
                    background-color: #f9fafb;
                  }

                  .prose tr:hover td {
                    background-color: #eff6ff;
                    cursor: pointer;
                  }

                  .prose hr {
                    border: none;
                    border-top: 2px solid #e5e7eb;
                    margin: 3rem 0;
                  }

                  .prose a {
                    color: #2563eb;
                    text-decoration: underline;
                    text-underline-offset: 0.25rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                  }

                  .prose a:hover {
                    color: #1e40af;
                    text-decoration-thickness: 2px;
                    text-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
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
            )}
          </CardContent>
        </Card>

        {/* 프린터 출력 - 최소화 */}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-gray-600 hover:text-gray-800"
          >
            🖨️ 프린터 출력
          </Button>
        </div>
      </main>
    </div>
  )
}
