"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import rehypeRaw from "rehype-raw"

export default function FollowupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [textAnalysis, setTextAnalysis] = useState<string>("")
  const [meetingNotes, setMeetingNotes] = useState<string>("")
  const [followupAnalysis, setFollowupAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      setProjectId(id)
    })
  }, [params])

  useEffect(() => {
    if (!projectId) return

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "데이터를 불러올 수 없습니다")
        }

        setCompanyName(data.companyName)
        setTextAnalysis(data.report?.textAnalysis || "")
        setMeetingNotes(data.report?.meetingNotes || "")
        setFollowupAnalysis(data.report?.followupAnalysis || null)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  const handleGenerateFollowup = async () => {
    if (!projectId || !meetingNotes.trim() || generating) return

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingNotes: meetingNotes.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "후속 분석 생성 실패")
      }

      setFollowupAnalysis(data.followupAnalysis)
    } catch (err) {
      console.error("Followup generation error:", err)
      setError(err instanceof Error ? err.message : "후속 분석 생성 중 오류가 발생했습니다.")
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !followupAnalysis) {
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
            <h1 className="text-xl md:text-2xl font-bold break-words">{companyName} 후속 미팅 대응</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              미팅 결과를 입력하면 AI가 추가 분석 및 대응 전략을 제안합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/analysis`)}
              className="text-xs md:text-sm"
            >
              분석제안서
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-100 text-xs md:text-sm"
              disabled
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 면책 문구 */}
        <p className="text-xs text-gray-500 mb-4 text-center">
          본 자료는 영업 참고용이며, 정확한 금액 계산과 법률적 판단은 전문가와 상담하시기 바랍니다.
        </p>

        {/* 미팅 결과 입력 섹션 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">미팅 결과 입력</CardTitle>
            <CardDescription>
              고객사 대표와의 미팅에서 나온 내용을 입력해주세요.<br />
              예: 고객의 반응, 추가 요청사항, 우려사항, 예산 관련 피드백 등
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              placeholder="예시:
- 대표님이 ERP 도입에 관심을 보이셨으나 비용이 부담된다고 하심
- 기존 시스템과의 연동 가능 여부를 물어보심
- 직원들의 교육 기간이 얼마나 걸리는지 궁금해하심
- 다른 업체 사례가 있으면 보여달라고 하심
- 분할 납부가 가능한지 문의하심"
              className="w-full min-h-[200px] p-4 border rounded-lg resize-y focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={generating}
            />
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleGenerateFollowup}
                disabled={!meetingNotes.trim() || generating}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {generating ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    분석 생성 중... (1-2분 소요)
                  </>
                ) : followupAnalysis ? (
                  "분석 다시 생성하기"
                ) : (
                  "후속 대응 분석 생성"
                )}
              </Button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* 후속 분석 결과 */}
        {followupAnalysis && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-green-700">AI 후속 대응 분석</CardTitle>
              <CardDescription>
                미팅 결과와 기존 분석 내용을 바탕으로 생성된 후속 대응 전략입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {followupAnalysis}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 기존 분석 요약 (접을 수 있는 섹션) */}
        {textAnalysis && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 py-2">
              기존 분석 제안서 보기 (참고용)
            </summary>
            <Card className="mt-2 bg-gray-50">
              <CardContent className="p-4">
                <div className="prose prose-sm max-w-none text-gray-600 max-h-96 overflow-y-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {textAnalysis}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </details>
        )}
      </main>
    </div>
  )
}
