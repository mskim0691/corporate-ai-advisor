"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface DeleteProjectButtonProps {
  projectId: string
  companyName: string
}

export function DeleteProjectButton({ projectId, companyName }: DeleteProjectButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`"${companyName}" 프로젝트를 삭제하시겠습니까?\n\n업로드된 파일과 모든 분석 결과가 영구적으로 삭제됩니다.`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "삭제 실패")
      }

      // 성공적으로 삭제되면 페이지 새로고침
      router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
      alert(error instanceof Error ? error.message : "프로젝트 삭제 중 오류가 발생했습니다")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      {deleting ? "삭제 중..." : "삭제"}
    </Button>
  )
}
