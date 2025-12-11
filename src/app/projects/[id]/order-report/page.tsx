"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OrderReportPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userCredits, setUserCredits] = useState(0)
  const [presentationCost, setPresentationCost] = useState<number | null>(null)
  const [ordering, setOrdering] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      setProjectId(id)
    })
  }, [params])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both user data and presentation cost in parallel
        const [userResponse, priceResponse] = await Promise.all([
          fetch('/api/user/subscription'),
          fetch('/api/admin/credit-prices')
        ])

        const userData = await userResponse.json()
        const priceData = await priceResponse.json()

        setUserCredits(userData.credits || 0)

        const premiumPrice = priceData.find((p: any) => p.type === 'premium_presentation')
        if (premiumPrice) {
          setPresentationCost(premiumPrice.credits)
        } else {
          console.error('Premium presentation price not found')
          setPresentationCost(700) // fallback value
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setPresentationCost(700) // fallback value
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleOrder = async () => {
    if (!projectId || !presentationCost) return

    // 크레딧 부족 확인
    if (userCredits < presentationCost) {
      const confirmed = window.confirm(
        "크레딧이 부족합니다. 충전페이지로 이동하시겠습니까?"
      )
      if (confirmed) {
        router.push("/credit-history")
      }
      return
    }

    setOrdering(true)

    try {
      // 크레딧 차감 및 리포트 주문 요청
      const response = await fetch(`/api/projects/${projectId}/order-report`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "주문에 실패했습니다")
      }

      alert("잘 신청되었습니다.")

      // analysis 페이지로 돌아가기
      router.push(`/projects/${projectId}/analysis`)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "주문 중 오류가 발생했습니다")
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">고급 프레젠테이션 제작 신청</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">고급 프레젠테이션 제작 서비스</CardTitle>
            <CardDescription>
              AI 엔진이 분석 결과를 전문적인 프레젠테이션으로 변환해드립니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 서비스 설명 */}
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <h3 className="font-semibold text-lg mb-2 text-blue-900">서비스 안내</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>생성된 솔루션을 최고의 AI 엔진이 고급 프레젠테이션으로 변환해드립니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>생성되는 데 소요되는 시간은 약 30분에서 한 시간 정도입니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>
                      완성된 프레젠테이션 파일(PDF)는{" "}
                      {projectId && (
                        <Link
                          href={`/projects/${projectId}/library`}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          라이브러리
                        </Link>
                      )}
                      에서 확인할 수 있습니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <span>
                      제작 요청 시 보유하신 크레딧에서{" "}
                      <span className="font-bold text-red-600">{presentationCost ?? '...'} 크레딧</span>
                      만큼 차감됩니다.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 현재 보유 크레딧 표시 */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">현재 보유 크레딧</span>
                  <span className="text-2xl font-bold text-blue-600">{userCredits}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-300">
                  <span className="text-gray-700">차감 예정 크레딧</span>
                  <span className="text-xl font-bold text-red-600">-{presentationCost ?? '...'}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-900">제작 후 잔여 크레딧</span>
                  <span className={`text-xl font-bold ${presentationCost && userCredits >= presentationCost ? 'text-green-600' : 'text-red-600'}`}>
                    {presentationCost ? userCredits - presentationCost : '...'}
                  </span>
                </div>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/projects/${projectId}/analysis`)}
                className="flex-1"
              >
                뒤로
              </Button>
              <Button
                onClick={handleOrder}
                disabled={ordering || !presentationCost}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {ordering ? "신청 중..." : `신청하기 (-${presentationCost ?? '...'} 크레딧)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
