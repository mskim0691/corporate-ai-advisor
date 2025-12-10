"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [status, setStatus] = useState("processing")
  const [projectId, setProjectId] = useState<string | null>(null)

  // Unwrap params Promise
  useEffect(() => {
    params.then(({ id }) => {
      setProjectId(id)
    })
  }, [params])

  useEffect(() => {
    if (!projectId) return

    // 첫 진입 시 분석 시작
    const startAnalysis = async () => {
      try {
        await fetch(`/api/projects/${projectId}/detailed-analysis`, {
          method: "POST",
        })
      } catch (error) {
        console.error("Failed to start analysis:", error)
      }
    }

    // 한 번만 실행
    startAnalysis()

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/status`)
        const data = await response.json()

        if (data.status === "completed") {
          router.push(`/projects/${projectId}/analysis`)
        } else if (data.status === "failed") {
          setStatus("failed")
        }
      } catch (error) {
        console.error("Status check error:", error)
      }
    }

    // 즉시 한번 체크
    checkStatus()

    const interval = setInterval(checkStatus, 3000)

    return () => clearInterval(interval)
  }, [projectId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "processing" ? "분석 진행 중" : "분석 실패"}
          </CardTitle>
          <CardDescription className="text-center">
            {status === "processing"
              ? "AI가 문서를 분석하고 있습니다. 잠시만 기다려주세요..."
              : "분석 중 오류가 발생했습니다. 다시 시도해주세요."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          {status === "processing" ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-gray-600">
                약 2-3분 소요됩니다
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-red-600 mb-4">분석에 실패했습니다</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-blue-600 hover:underline"
              >
                대시보드로 돌아가기
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
