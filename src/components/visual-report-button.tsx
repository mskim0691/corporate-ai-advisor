"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface VisualReportButtonProps {
  projectId: string
  hasReport: boolean
  remainingCount?: number
}

export function VisualReportButton({
  projectId,
  hasReport,
  remainingCount = 0,
}: VisualReportButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (hasReport) {
      // 이미 리포트가 있으면 바로 이동
      router.push(`/projects/${projectId}/report`)
    } else {
      // 이번 달 비주얼레포트 생성 횟수 확인
      if (remainingCount <= 0) {
        alert("이번 달 비주얼 레포트 생성 횟수를 모두 사용했습니다.")
        return
      }

      // 확인 후 리포트 페이지로 이동
      const confirmMessage = `비주얼 레포트를 생성하시겠습니까?\n(이번 달 남은 횟수: ${remainingCount}회)`
      if (!confirm(confirmMessage)) {
        return
      }

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
