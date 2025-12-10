"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { MermaidDiagram } from "@/components/mermaid-diagram"

interface Project {
  id: string
  companyName: string
  businessNumber: string
  representative: string
  industry: string | null
}

interface Report {
  initialRiskAnalysis: string | null
  additionalRequest: string | null
  textAnalysis: string | null
}

export default function InitialRiskPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string>("")
  const [project, setProject] = useState<Project | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [additionalRequest, setAdditionalRequest] = useState("")
  const [isPro, setIsPro] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      setProjectId(id)
      fetchData(id)
    })
  }, [])

  const fetchData = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data)
        setReport(data.report)
        setAdditionalRequest(data.report?.additionalRequest || "")
      }

      // Fetch user subscription info
      const subRes = await fetch('/api/user/subscription')
      if (subRes.ok) {
        const subData = await subRes.json()
        setIsPro(subData.plan === 'pro')
        setIsAdmin(subData.role === 'admin')
      }
    } catch (error) {
      console.error("Failed to fetch project:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdditionalAnalysis = async () => {
    if (!projectId) return

    setAnalyzing(true)
    try {
      // 1. 추가 분석 요청사항을 데이터베이스에 저장
      const updateRes = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalRequest }),
      })

      if (!updateRes.ok) {
        alert("추가 분석 요청 저장 중 오류가 발생했습니다.")
        return
      }

      // 2. 상세 분석 (detailed-analysis) 실행
      const res = await fetch(`/api/projects/${projectId}/detailed-analysis`, {
        method: "POST",
      })

      if (res.ok) {
        // 3. 분석 완료 후 analysis 페이지로 이동
        router.push(`/projects/${projectId}/analysis`)
      } else {
        alert("추가 분석 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("Additional analysis error:", error)
      alert("추가 분석 중 오류가 발생했습니다.")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleMoveToSolution = async () => {
    if (!projectId) return

    // 이미 상세 분석이 완료되었다면 바로 이동
    if (report?.textAnalysis) {
      router.push(`/projects/${projectId}/analysis`)
      return
    }

    // 상세 분석이 없으면 새로 생성
    setAnalyzing(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/detailed-analysis`, {
        method: "POST",
      })

      if (res.ok) {
        router.push(`/projects/${projectId}/analysis`)
      } else {
        alert("상세 솔루션 분석 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("Detailed analysis error:", error)
      alert("상세 솔루션 분석 중 오류가 발생했습니다.")
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!project || !report || !report.initialRiskAnalysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>분석 결과를 찾을 수 없습니다</CardTitle>
          </CardHeader>
          <CardContent>
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
            <h1 className="text-2xl font-bold">{project.companyName} 1차 현황분석</h1>
            <p className="text-sm text-gray-600">라이브러리에 올려주신 파일을 바탕으로 기업 현황을 분석합니다.</p>
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
              현황분석
            </Button>
            <Button
              variant="outline"
              onClick={handleMoveToSolution}
              disabled={analyzing}
            >
              {analyzing ? "분석 중..." : report?.textAnalysis ? "솔루션" : "솔루션 생성"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/report`)}
            >
              리포트
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              대시보드
            </Button>
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link href="/admin">관리</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardContent className="bg-white flex justify-center">
            <div className="prose prose-lg w-4/5 px-6 py-4">
              <style jsx global>{`
                .prose h1 {
                  color: #0f172a;
                  font-size: 2rem;
                  font-weight: 800;
                  margin-top: 2rem;
                  margin-bottom: 1.5rem;
                  padding-bottom: 1rem;
                  border-bottom: 4px solid #2563eb;
                  letter-spacing: -0.025em;
                }

                .prose h2 {
                  color: #1e40af;
                  font-size: 1.75rem;
                  font-weight: 700;
                  margin-top: 3rem;
                  margin-bottom: 1.5rem;
                  padding-bottom: 0.75rem;
                  padding-top: 0.5rem;
                  border-bottom: 3px solid #3b82f6;
                  background: linear-gradient(to right, #eff6ff 0%, transparent 100%);
                  padding-left: 1rem;
                  margin-left: -1rem;
                  padding-right: 1rem;
                }

                .prose h3 {
                  color: #1e3a8a;
                  font-size: 1.5rem;
                  font-weight: 700;
                  margin-top: 2.5rem;
                  margin-bottom: 1.25rem;
                  padding-left: 1rem;
                  border-left: 4px solid #60a5fa;
                  background-color: #f8fafc;
                  padding-top: 0.75rem;
                  padding-bottom: 0.75rem;
                }

                .prose h4 {
                  color: #1e40af;
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                  padding-left: 0.75rem;
                  border-left: 3px solid #93c5fd;
                }

                .prose p {
                  color: #374151;
                  line-height: 2;
                  margin-bottom: 1.5rem;
                  font-size: 1.0625rem;
                  text-align: justify;
                }

                .prose ul, .prose ol {
                  margin-top: 1.25rem;
                  margin-bottom: 2rem;
                  padding-left: 2.5rem;
                }

                .prose li {
                  color: #374151;
                  line-height: 2;
                  margin-bottom: 1rem;
                  font-size: 1.0625rem;
                }

                .prose ul > li {
                  padding-left: 0.75rem;
                  position: relative;
                }

                .prose ul > li::marker {
                  color: #3b82f6;
                  font-weight: bold;
                }

                .prose ol > li {
                  padding-left: 0.75rem;
                }

                .prose ol > li::marker {
                  color: #3b82f6;
                  font-weight: bold;
                }

                .prose strong {
                  color: #0f172a;
                  font-weight: 700;
                  background-color: #fef3c7;
                  padding: 0.125rem 0.25rem;
                  border-radius: 0.25rem;
                }

                .prose em {
                  color: #475569;
                  font-style: italic;
                }

                .prose blockquote {
                  border-left: 5px solid #3b82f6;
                  padding-left: 2rem;
                  padding-top: 1rem;
                  padding-bottom: 1rem;
                  padding-right: 1rem;
                  font-style: normal;
                  color: #1e40af;
                  background: linear-gradient(to right, #eff6ff 0%, #f8fafc 100%);
                  margin: 2rem 0;
                  border-radius: 0.5rem;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .prose blockquote p {
                  margin-bottom: 0.5rem;
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
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
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
                {report.initialRiskAnalysis}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>추가 분석 요청</CardTitle>
            <CardDescription>
              위 분석 내용에 덧붙여 회원님이 별도로 알게된 여러가지 정보가 있다면 자유롭게 적어주세요. 내용이 자세할 수록 적절한 솔루션을 제공해드립니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="additionalRequest">추가 분석 내용</Label>
              <textarea
                id="additionalRequest"
                value={additionalRequest}
                onChange={(e) => setAdditionalRequest(e.target.value)}
                className="w-full min-h-[120px] p-3 border rounded-md mt-2"
                placeholder="예: 현금흐름을 더 자세히 분석해주세요, 경쟁사 대비 재무 상태를 비교해주세요 등"
              />
            </div>
            <Button
              onClick={handleMoveToSolution}
              disabled={analyzing}
              className="w-full"
            >
              {analyzing ? "분석 중..." : "솔루션"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
