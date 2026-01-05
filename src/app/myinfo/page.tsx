"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserInfo {
  name: string
  email: string
  plan: string
  // credits: number // 크레딧 기능 비활성화
}

export default function MyInfoPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUserInfo()
  }, [])

  async function fetchUserInfo() {
    try {
      const res = await fetch("/api/user/info")
      if (res.status === 401) {
        router.push("/auth/login")
        return
      }
      if (!res.ok) {
        throw new Error("Failed to fetch user info")
      }
      const data = await res.json()
      setUserInfo(data)
      setNewName(data.name || "")
    } catch (error) {
      console.error("Failed to fetch user info:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!newName.trim()) {
      alert("이름을 입력해주세요")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/user/info", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      })

      if (!res.ok) {
        throw new Error("Failed to update name")
      }

      const data = await res.json()
      setUserInfo(data)
      setEditMode(false)
      alert("이름이 업데이트되었습니다")
    } catch (error) {
      console.error("Failed to update name:", error)
      alert("이름 업데이트에 실패했습니다")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setNewName(userInfo?.name || "")
    setEditMode(false)
  }

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case "free":
        return "무료"
      case "pro":
        return "프로"
      case "standard":
        return "스탠다드"
      default:
        return plan
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    )
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>사용자 정보를 불러올 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI-GFC</h1>
          <div className="space-x-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              대시보드
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            ← 뒤로
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>회원 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email - Read only */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={userInfo.email}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Name - Editable */}
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              {editMode ? (
                <div className="flex gap-2">
                  <Input
                    id="name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="이름을 입력하세요"
                  />
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "저장 중..." : "저장"}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    취소
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="name"
                    type="text"
                    value={userInfo.name || "이름 없음"}
                    disabled
                    className="bg-gray-50"
                  />
                  <Button onClick={() => setEditMode(true)}>수정</Button>
                </div>
              )}
            </div>

            {/* Membership Plan - Read only */}
            <div className="space-y-2">
              <Label htmlFor="plan">멤버십 등급</Label>
              <Input
                id="plan"
                type="text"
                value={getPlanLabel(userInfo.plan)}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* 크레딧 기능 비활성화
            {/* Credits - Read only with recharge button *}
            <div className="space-y-2">
              <Label htmlFor="credits">보유 크레딧</Label>
              <div className="flex gap-2">
                <Input
                  id="credits"
                  type="text"
                  value={userInfo.credits || 0}
                  disabled
                  className="bg-gray-50"
                />
                <Button onClick={() => router.push("/credit-history")}>
                  충전하기
                </Button>
              </div>
            </div>
            */}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
