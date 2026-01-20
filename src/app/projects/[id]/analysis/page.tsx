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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{companyName} 분석제안서</h1>
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMarkdown(!showMarkdown)}
                  className={`text-xs md:text-sm ${showMarkdown ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-yellow-50 text-yellow-700 border-yellow-300"}`}
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
            <Button
              variant="outline"
              size="sm"
              onClick={handlePresentationClick}
              className="text-xs md:text-sm bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
              disabled={!hasPdfReport && !canCreatePresentation}
            >
              비주얼 레포트
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
                <div className="prose prose-base max-w-none p-4 md:p-8 lg:p-12 leading-loose
                  prose-headings:text-blue-800 prose-headings:font-bold
                  prose-h1:text-2xl prose-h1:border-b-2 prose-h1:border-blue-300 prose-h1:pb-4 prose-h1:mb-8 prose-h1:mt-8
                  prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b-2 prose-h2:border-blue-200 prose-h2:bg-blue-50 prose-h2:px-4 prose-h2:py-2 prose-h2:rounded-t-lg
                  prose-h3:text-lg prose-h3:text-blue-700 prose-h3:mt-8 prose-h3:mb-4 prose-h3:font-semibold prose-h3:pl-4 prose-h3:border-l-4 prose-h3:border-blue-400
                  prose-h4:text-base prose-h4:text-blue-600 prose-h4:mt-6 prose-h4:mb-3 prose-h4:font-medium prose-h4:pl-8
                  prose-p:text-gray-700 prose-p:leading-loose prose-p:my-4 prose-p:pl-4
                  prose-strong:text-blue-800
                  prose-ul:my-4 prose-ul:space-y-2 prose-ul:pl-8
                  prose-ol:my-4 prose-ol:space-y-2 prose-ol:pl-8
                  prose-li:text-gray-700 prose-li:marker:text-blue-500 prose-li:leading-relaxed
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-700 prose-blockquote:my-6 prose-blockquote:ml-4
                  prose-table:border-collapse prose-table:w-full prose-table:my-6
                  prose-th:bg-blue-100 prose-th:text-blue-800 prose-th:font-semibold prose-th:p-3 prose-th:border prose-th:border-blue-200
                  prose-td:p-3 prose-td:border prose-td:border-blue-100
                  prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
                  prose-code:bg-blue-50 prose-code:text-blue-800 prose-code:px-1 prose-code:rounded
                  prose-hr:my-10 prose-hr:border-blue-300 prose-hr:border-t-2
                ">
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

        {/* 강조 문구 */}
        <div className="mt-8 mb-4 text-center">
          <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 print:text-blue-700">
            기업컨설팅을 위한 가장 빠르고 편리한 도구, AI-GFC
          </p>
        </div>
      </main>
    </div>
  )
}
