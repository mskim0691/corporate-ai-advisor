"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface VisualReportButtonProps {
  projectId: string
  hasReport: boolean
  remainingCredits: number
}

export function VisualReportButton({
  projectId,
  hasReport,
  remainingCredits,
}: VisualReportButtonProps) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)

  const handleClick = () => {
    if (hasReport) {
      // 이미 리포트가 있으면 바로 이동
      router.push(`/projects/${projectId}/report`)
    } else {
      // 리포트가 없으면 다이얼로그 표시
      setShowDialog(true)
    }
  }

  const handleConfirm = () => {
    setShowDialog(false)
    router.push(`/projects/${projectId}/report`)
  }

  return (
    <>
      <Button
        variant={hasReport ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        className={hasReport ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
      >
        비주얼레포트
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비주얼 레포트 생성</DialogTitle>
            <DialogDescription>
              아직 비주얼레포트가 생성되지 않았습니다. 생성할까요?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              취소
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={remainingCredits < 1}
              className={remainingCredits < 1 ? "opacity-50 cursor-not-allowed" : ""}
            >
              OK (이용권 -1 차감)
            </Button>
          </DialogFooter>
          {remainingCredits < 1 && (
            <p className="text-sm text-red-500 text-center mt-2">
              이용권이 부족합니다. Pro로 업그레이드하거나 다음 달까지 기다려주세요.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
