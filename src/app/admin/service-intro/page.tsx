"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminServiceIntroPage() {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/admin/service-intro")
      if (response.ok) {
        const data = await response.json()
        setContent(data.content || "")
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content || ""
        }
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
      const htmlContent = editorRef.current?.innerHTML || ""

      const response = await fetch("/api/admin/service-intro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: htmlContent }),
      })

      if (response.ok) {
        setMessage("저장되었습니다.")
        setContent(htmlContent)
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

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/service-intro/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        // Insert image at cursor position
        const img = document.createElement("img")
        img.src = data.url
        img.style.maxWidth = "100%"
        img.style.height = "auto"
        img.style.margin = "1rem 0"

        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.insertNode(img)
          range.setStartAfter(img)
          range.setEndAfter(img)
          selection.removeAllRanges()
          selection.addRange(range)
        } else if (editorRef.current) {
          editorRef.current.appendChild(img)
        }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

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
          <CardDescription>이미지를 삽입하고 텍스트를 작성할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("bold")}
            >
              <strong>B</strong>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("italic")}
            >
              <em>I</em>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("underline")}
            >
              <u>U</u>
            </Button>
            <div className="w-px h-6 bg-gray-300 self-center" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("formatBlock", "h1")}
            >
              H1
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("formatBlock", "h2")}
            >
              H2
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("formatBlock", "h3")}
            >
              H3
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("formatBlock", "p")}
            >
              P
            </Button>
            <div className="w-px h-6 bg-gray-300 self-center" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("insertUnorderedList")}
            >
              • 목록
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("insertOrderedList")}
            >
              1. 목록
            </Button>
            <div className="w-px h-6 bg-gray-300 self-center" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("justifyLeft")}
            >
              왼쪽
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("justifyCenter")}
            >
              가운데
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("justifyRight")}
            >
              오른쪽
            </Button>
            <div className="w-px h-6 bg-gray-300 self-center" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "업로드 중..." : "이미지 삽입"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[500px] p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 prose prose-lg max-w-none bg-white"
            dangerouslySetInnerHTML={{ __html: content }}
            onPaste={(e) => {
              // Handle image paste
              const items = e.clipboardData?.items
              if (items) {
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.indexOf("image") !== -1) {
                    e.preventDefault()
                    const file = items[i].getAsFile()
                    if (file) {
                      handleImageUpload(file)
                    }
                    return
                  }
                }
              }
            }}
          />

          {/* Actions */}
          <div className="flex items-center justify-between">
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
