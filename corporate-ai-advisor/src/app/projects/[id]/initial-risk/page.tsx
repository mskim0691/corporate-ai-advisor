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
      const res = await fetch(`/api/projects/${projectId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalRequest }),
      })

      if (res.ok) {
        await fetchData(projectId)
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
            <h1 className="text-2xl font-bold">{project.companyName} 기업분석</h1>
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
          <CardHeader>
            <CardTitle>1단계: 현황분석</CardTitle>
            <CardDescription>
              현황 및 예상되는 리스크를 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none">
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
                  line-height: 1.9;
                  margin-bottom: 1.25rem;
                }

                .prose ul, .prose ol {
                  margin-top: 1rem;
                  margin-bottom: 1.75rem;
                  padding-left: 2rem;
                }

                .prose li {
                  color: #374151;
                  line-height: 1.8;
                  margin-bottom: 0.75rem;
                }

                .prose ul > li {
                  padding-left: 0.5rem;
                }

                .prose ol > li {
                  padding-left: 0.5rem;
                }

                .prose strong {
                  color: #1f2937;
                  font-weight: 600;
                }

                .prose blockquote {
                  border-left: 4px solid #3b82f6;
                  padding-left: 1.5rem;
                  padding-top: 0.5rem;
                  padding-bottom: 0.5rem;
                  font-style: italic;
                  color: #4b5563;
                  background-color: #f9fafb;
                  margin: 1.5rem 0;
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
              위 분석 내용에 만족하십니까? 더 분석하면 좋을 것 같은 내용을 아래에 추가해주시면 반영해서 다시 분석해드립니다.
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
            <div className="flex gap-4">
              <Button
                onClick={handleAdditionalAnalysis}
                disabled={analyzing || !additionalRequest.trim() || !isPro || !!report?.textAnalysis}
                className="flex-1"
              >
                {analyzing ? "분석 중..." : "추가분석"} {!isPro && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Pro only</span>}
              </Button>
              <Button
                onClick={handleMoveToSolution}
                variant="outline"
                disabled={analyzing}
                className="flex-1"
              >
                {analyzing ? "분석 중..." : "솔루션"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
