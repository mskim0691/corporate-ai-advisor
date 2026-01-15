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
      return
    }

    // 확인 후 리포트 페이지로 이동
    const confirmMessage = `비주얼 레포트를 생성하시겠습니까?\n\n생성 완료 시 남은 횟수에서 1회가 차감됩니다.\n(현재 남은 횟수: ${remainingCount}회 → 생성 후: ${remainingCount - 1}회)`
    if (!confirm(confirmMessage)) {
      return
    }

    router.push(`/projects/${projectId}/report`)
  }

  // 이미 리포트가 있으면 항상 활성화
  if (hasReport) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={handleClick}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        비주얼레포트 보기
      </Button>
    )
  }

  // 리포트가 없고 남은 횟수가 0이면 비활성화
  if (remainingCount <= 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="opacity-50 cursor-not-allowed"
      >
        사용량 초과
      </Button>
    )
  }

  // 리포트가 없고 남은 횟수가 있으면 생성 버튼
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
    >
      비주얼레포트 생성
    </Button>
  )
}
