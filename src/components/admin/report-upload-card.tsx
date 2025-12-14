"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ReportUploadCardProps {
  project: {
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
  onUploadComplete: () => void
}

export function ReportUploadCard({ project, onUploadComplete }: ReportUploadCardProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('PDF 파일만 업로드 가능합니다')
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('파일 크기는 50MB 이하여야 합니다')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', project.id)
      formData.append('reportId', project.report?.id || '')

      const response = await fetch('/api/admin/upload-visual-report', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '업로드에 실패했습니다')
      }

      const data = await response.json()
      alert('비주얼 레포트가 성공적으로 업로드되었습니다!')

      // Reset file input
      e.target.value = ''

      // Notify parent to refresh
      onUploadComplete()
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{project.companyName}</CardTitle>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                신규 신청
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-semibold">대표자:</span> {project.representative}
              </p>
              <p>
                <span className="font-semibold">사업자번호:</span>{" "}
                {project.businessNumber || "미입력"}
              </p>
              {project.industry && (
                <p>
                  <span className="font-semibold">업종:</span> {project.industry}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">
              프로젝트 생성: {new Date(project.createdAt).toLocaleDateString("ko-KR")}
            </div>
            {project.report?.createdAt && (
              <div className="text-sm font-semibold text-purple-600 mb-2">
                신청 시간: {new Date(project.report.createdAt).toLocaleString("ko-KR")}
              </div>
            )}
            <div className="flex gap-2">
              <Link
                href={`/projects/${project.id}/analysis`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                분석 내용 보기
              </Link>
              <div className="relative">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  id={`upload-${project.id}`}
                />
                <label
                  htmlFor={`upload-${project.id}`}
                  className={`inline-block px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    uploading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {uploading ? '업로드 중...' : '레포트 업로드'}
                </label>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 사용자 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">요청 사용자 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">계정:</span>{" "}
                <span className="font-medium">{project.user.email}</span>
              </div>
              <div>
                <span className="text-gray-600">이름:</span>{" "}
                <span className="font-medium">{project.user.name || "미입력"}</span>
              </div>
            </div>
          </div>

          {/* 추가 분석 요청 */}
          {project.report?.additionalRequest && (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">추가 분석 요청</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {project.report.additionalRequest}
              </p>
            </div>
          )}

          {/* 프로젝트 정보 */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>업로드된 파일: {project._count.files}개</span>
            <Link
              href={`/projects/${project.id}/library`}
              className="text-blue-600 hover:underline"
            >
              파일 보기 →
            </Link>
          </div>

          {/* Upload progress bar */}
          {uploading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
