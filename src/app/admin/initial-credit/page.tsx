"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface InitialCreditPolicy {
  credits: number
  description: string | null
}

export default function InitialCreditPage() {
  const [policy, setPolicy] = useState<InitialCreditPolicy>({ credits: 0, description: null })
  const [credits, setCredits] = useState("0")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPolicy()
  }, [])

  const fetchPolicy = async () => {
    try {
      const response = await fetch("/api/admin/initial-credit")
      const data = await response.json()

      if (data.policy) {
        setPolicy(data.policy)
        setCredits(data.policy.credits.toString())
        setDescription(data.policy.description || "")
      }
    } catch (error) {
      console.error("Failed to fetch policy:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const creditValue = parseInt(credits)

    if (isNaN(creditValue) || creditValue < 0) {
      alert("유효한 크레딧 값을 입력해주세요")
      return
    }

    setSaving(true)

    try {
      const response = await fetch("/api/admin/initial-credit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credits: creditValue,
          description: description.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "저장에 실패했습니다")
      }

      alert("초기 크레딧 정책이 업데이트되었습니다")
      await fetchPolicy()
    } catch (error) {
      alert(error instanceof Error ? error.message : "저장 중 오류가 발생했습니다")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">신규 회원 초기 크레딧 설정</h1>
        <p className="mt-2 text-sm text-gray-600">
          새로운 회원가입 시 지급할 초기 크레딧을 설정합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>현재 정책</CardTitle>
          <CardDescription>
            신규 회원에게 지급되는 초기 크레딧
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-semibold">현재 설정된 초기 크레딧</span>
              <span className="text-3xl font-bold text-blue-600">{policy.credits}</span>
            </div>
            {policy.description && (
              <p className="mt-2 text-sm text-gray-600">{policy.description}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credits">초기 크레딧 수량</Label>
              <Input
                id="credits"
                type="number"
                min="0"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                placeholder="예: 1000"
              />
              <p className="text-sm text-gray-500">
                새로 가입하는 회원에게 지급할 크레딧 수량을 입력하세요
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택사항)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 신규 회원 웰컴 크레딧"
                rows={3}
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {saving ? "저장 중..." : "정책 저장"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-2">참고사항</h3>
              <ul className="space-y-1 text-sm text-yellow-800">
                <li>• 변경된 정책은 새로 가입하는 회원부터 적용됩니다</li>
                <li>• 기존 회원의 크레딧에는 영향을 주지 않습니다</li>
                <li>• 초기 크레딧은 회원가입 시 자동으로 지급됩니다</li>
                <li>• 0으로 설정하면 초기 크레딧을 지급하지 않습니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
