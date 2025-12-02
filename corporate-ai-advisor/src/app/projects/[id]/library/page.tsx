import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProjectHeader } from "@/components/project-header"

async function getProjectFiles(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: userId,
    },
    include: {
      files: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
    },
  })

  return project
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown"

  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
  return (bytes / (1024 * 1024)).toFixed(2) + " MB"
}

function getFileIcon(fileType: string | null): string {
  if (!fileType) return "📄"

  if (fileType.includes("pdf")) return "📕"
  if (fileType.includes("image")) return "🖼️"
  if (fileType.includes("text")) return "📝"
  if (fileType.includes("word") || fileType.includes("document")) return "📘"
  if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊"

  return "📄"
}

export default async function LibraryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  const { id } = await params
  const project = await getProjectFiles(id, session.user.id)

  if (!project) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectHeader
        projectId={project.id}
        companyName={project.companyName}
        currentPage="library"
        subtitle="올려주신 기업분석 기초자료 파일을 확인할 수 있는 곳입니다."
      />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>업로드된 파일 라이브러리</CardTitle>
            <CardDescription>
              프로젝트에 업로드된 모든 파일을 확인하실 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {project.files.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>업로드된 파일이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{getFileIcon(file.fileType)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{file.filename}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>•</span>
                          <span>{file.fileType || "Unknown type"}</span>
                          <span>•</span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/${file.filePath}`}
                        download={file.filename}
                        className="inline-flex"
                      >
                        <Button variant="outline" size="sm">
                          다운로드
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
