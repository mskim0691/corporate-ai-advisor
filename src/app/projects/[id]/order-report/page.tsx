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
  const [ordering, setOrdering] = useState(false)
  const [sampleImages, setSampleImages] = useState<string[]>([])

  useEffect(() => {
    params.then(({ id }) => {
      setProjectId(id)
      setLoading(false)
    })
  }, [params])

  useEffect(() => {
    // Fetch sample images
    const fetchSampleImages = async () => {
      try {
        const response = await fetch('/api/sample-reports')
        const data = await response.json()
        if (response.ok) {
          setSampleImages(data.images || [])
        }
      } catch (err) {
        console.error('Failed to fetch sample images:', err)
      }
    }

    fetchSampleImages()
  }, [])

  /* 크레딧 기능 비활성화
  const [userCredits, setUserCredits] = useState(0)
  const [presentationCost, setPresentationCost] = useState<number | null>(null)

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
  */

  const handleOrder = async () => {
    if (!projectId) return

    /* 크레딧 기능 비활성화
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
    */

    setOrdering(true)

    try {
      // 리포트 주문 요청
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
          <h1 className="text-2xl font-bold">비주얼 레포트 생성 요청</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">비주얼 레포트 제작 서비스</CardTitle>
            <CardDescription>
              AI 엔진이 분석솔루션 결과를 비주얼 레포트로 변환해드립니다.
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
                    <span>생성된 분석솔루션을 최고의 AI 엔진이 고급 비주얼 레포트로 변환해드립니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>생성되는 데 소요되는 시간은 약 30분에서 한 시간 정도입니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>
                      완성된 비주얼 레포트 파일(PDF)은{" "}
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
                  {/* 크레딧 기능 비활성화
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <span>
                      제작 요청 시 보유하신 크레딧에서{" "}
                      <span className="font-bold text-red-600">{presentationCost ?? '...'} 크레딧</span>
                      만큼 차감됩니다.
                    </span>
                  </li>
                  */}
                </ul>
              </div>

              {/* 크레딧 기능 비활성화
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
              */}
            </div>

            {/* 샘플 이미지 섹션 */}
            {sampleImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">비주얼 레포트 샘플</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sampleImages.map((imageUrl, index) => (
                    <div key={index} className="relative aspect-[16/9] rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors">
                      <img
                        src={imageUrl}
                        alt={`샘플 ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                disabled={ordering}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {ordering ? "신청 중..." : "신청하기 (이용권 -1 차감)"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
