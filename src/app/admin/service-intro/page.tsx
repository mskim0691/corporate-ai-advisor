"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(
  () => import("react-quill-new"),
  {
    ssr: false,
    loading: () => <div className="h-[500px] border rounded-lg flex items-center justify-center bg-gray-50">에디터 로딩 중...</div>
  }
)

export default function AdminServiceIntroPage() {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/admin/service-intro")
      if (response.ok) {
        const data = await response.json()
        setContent(data.content || "")
      }
    } catch (error) {
      console.error("Failed to fetch content:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/admin/service-intro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        setMessage("저장되었습니다.")
      } else {
        setMessage("저장에 실패했습니다.")
      }
    } catch (error) {
      console.error("Failed to save:", error)
      setMessage("저장 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async () => {
    const input = document.createElement("input")
    input.setAttribute("type", "file")
    input.setAttribute("accept", "image/*")
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      setIsUploading(true)
      setMessage("이미지 업로드 중...")

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/admin/service-intro/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          // Insert image HTML at the end of content
          const imgHtml = `<p><img src="${data.url}" alt="uploaded image" style="max-width: 100%; height: auto;"></p>`
          setContent(prev => prev + imgHtml)
          setMessage("이미지가 추가되었습니다. 에디터에서 위치를 조정하세요.")
        } else {
          setMessage("이미지 업로드에 실패했습니다.")
        }
      } catch (error) {
        console.error("Failed to upload image:", error)
        setMessage("이미지 업로드 중 오류가 발생했습니다.")
      } finally {
        setIsUploading(false)
      }
    }
  }

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      [{ font: [] }],
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link", "image"],
      ["blockquote", "code-block"],
      ["clean"],
    ],
    clipboard: {
      matchVisual: false,
    },
  }), [])

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
    "blockquote",
    "code-block",
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">서비스소개 관리</h1>
        <p className="text-gray-600">서비스소개 페이지의 내용을 편집합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>에디터</CardTitle>
          <CardDescription>텍스트를 선택하고 도구 모음에서 스타일을 적용하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <style jsx global>{`
            .ql-container {
              height: 500px;
              font-size: 16px;
              overflow-y: auto;
            }
            .ql-editor {
              min-height: 100%;
            }
            .ql-toolbar {
              background: #f9fafb;
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
            }
            .ql-container {
              border-bottom-left-radius: 8px;
              border-bottom-right-radius: 8px;
            }
            .ql-editor h1 {
              font-size: 2em;
              font-weight: bold;
              margin-bottom: 0.5em;
            }
            .ql-editor h2 {
              font-size: 1.5em;
              font-weight: bold;
              margin-bottom: 0.5em;
            }
            .ql-editor h3 {
              font-size: 1.25em;
              font-weight: bold;
              margin-bottom: 0.5em;
            }
            .ql-editor h4 {
              font-size: 1.1em;
              font-weight: bold;
              margin-bottom: 0.5em;
            }
            .ql-editor img {
              max-width: 100%;
              height: auto;
            }
            .ql-snow .ql-picker.ql-header .ql-picker-label::before,
            .ql-snow .ql-picker.ql-header .ql-picker-item::before {
              content: '본문';
            }
            .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
            .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before {
              content: '제목 1';
            }
            .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
            .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before {
              content: '제목 2';
            }
            .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before,
            .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before {
              content: '제목 3';
            }
            .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="4"]::before,
            .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="4"]::before {
              content: '제목 4';
            }
            /* Paragraph and line spacing */
            .ql-editor p {
              margin-bottom: 1em;
              line-height: 1.8;
            }
            .ql-editor p:empty {
              min-height: 1.5em;
            }
            .ql-editor p br {
              content: "";
            }
          `}</style>

          {/* Image upload button */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleImageUpload}
              disabled={isUploading}
            >
              {isUploading ? "업로드 중..." : "이미지 업로드 (서버 저장)"}
            </Button>
            <span className="text-sm text-gray-500 self-center">
              * 툴바의 이미지 버튼은 URL 입력용입니다
            </span>
          </div>

          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            placeholder="내용을 입력하세요..."
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div>
              {message && (
                <p className={`text-sm ${message.includes("실패") || message.includes("오류") ? "text-red-600" : "text-green-600"}`}>
                  {message}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open("/service-intro", "_blank")}
              >
                미리보기
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
