"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface VisualReportButtonProps {
  projectId: string
  hasReport: boolean
  remainingCredits?: number
}

export function VisualReportButton({
  projectId,
  hasReport,
  remainingCredits: propRemainingCredits,
}: VisualReportButtonProps) {
  const router = useRouter()
  const [visualReportCredits, setVisualReportCredits] = useState(propRemainingCredits || 0)

  useEffect(() => {
    fetchUserCredits()
  }, [])

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/info')
      if (response.ok) {
        const data = await response.json()
        setVisualReportCredits(data.credits || 0)
      }
    } catch (err) {
      console.error('Failed to fetch user credits:', err)
    }
  }

  const handleClick = () => {
    if (hasReport) {
      // 이미 리포트가 있으면 바로 이동
      router.push(`/projects/${projectId}/report`)
    } else {
      // 비주얼레포트 이용권 확인
      if (visualReportCredits <= 0) {
        alert("이용권이 모자랍니다.")
        return
      }

      // 이용권 차감 확인
      const confirmMessage = `이용권 -1 차감됩니다. 계속하시겠습니까?`
      if (!confirm(confirmMessage)) {
        return
      }

      // 확인 후 리포트 페이지로 이동
      router.push(`/projects/${projectId}/report`)
    }
  }

  return (
    <Button
      variant={hasReport ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      className={hasReport ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
    >
      비주얼레포트 생성
    </Button>
  )
}
