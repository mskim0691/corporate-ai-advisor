"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ReportUploadCard } from "@/components/admin/report-upload-card"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  companyName: string
  representative: string
  businessNumber: string | null
  industry: string | null
  createdAt: Date
  user: {
    id: string
    email: string
    name: string | null
  }
  report: {
    id: string
    reportType: string
    additionalRequest: string | null
    createdAt: Date
  } | null
  _count: {
    files: number
  }
}

interface MakeReportClientProps {
  initialProjects: Project[]
}

export function MakeReportClient({ initialProjects }: MakeReportClientProps) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)

  const handleUploadComplete = () => {
    // Refresh the page to update the list
    router.refresh()
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          현재 대기 중인 비주얼 레포트 제작 요청이 없습니다
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {projects.map((project) => (
        <ReportUploadCard
          key={project.id}
          project={project}
          onUploadComplete={handleUploadComplete}
        />
      ))}
    </div>
  )
}
