"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminServiceIntroPage() {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const savedSelectionRef = useRef<Range | null>(null)

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

  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange()
    }
  }

  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedSelectionRef.current)
      }
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const handleFormatBlock = (tag: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      editorRef.current?.focus()
      return
    }

    // Find the current block element
    let node = selection.anchorNode as HTMLElement | null
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        const tagName = element.tagName.toLowerCase()
        // Check if this is a block-level element
        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'].includes(tagName)) {
          // Create new element with the desired tag
          const newElement = document.createElement(tag)
          newElement.innerHTML = element.innerHTML

          // Copy styles if needed
          if (tag === 'p') {
            // Reset styles for paragraph
            newElement.style.cssText = ''
          }

          element.parentNode?.replaceChild(newElement, element)

          // Restore cursor position
          const range = document.createRange()
          range.selectNodeContents(newElement)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)

          editorRef.current?.focus()
          return
        }
      }
      node = node.parentElement
    }

    // Fallback to execCommand if no block element found
    document.execCommand("formatBlock", false, `<${tag}>`)
    editorRef.current?.focus()
  }

  const openLinkModal = () => {
    saveSelection()
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      setLinkText(selection.toString())
    } else {
      setLinkText("")
    }
    setLinkUrl("")
    setShowLinkModal(true)
  }

  const insertLink = () => {
    restoreSelection()
    editorRef.current?.focus()

    if (linkUrl) {
      if (linkText) {
        // If we have custom text, insert an anchor element
        const anchor = document.createElement("a")
        anchor.href = linkUrl
        anchor.textContent = linkText
        anchor.target = "_blank"
        anchor.rel = "noopener noreferrer"
        anchor.style.color = "#2563eb"
        anchor.style.textDecoration = "underline"

        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          range.insertNode(anchor)
          range.setStartAfter(anchor)
          range.setEndAfter(anchor)
          selection.removeAllRanges()
          selection.addRange(range)
        }
      } else {
        // Use createLink command for selected text
        document.execCommand("createLink", false, linkUrl)
        // Style the link
        const selection = window.getSelection()
        if (selection && selection.anchorNode?.parentElement?.tagName === "A") {
          const link = selection.anchorNode.parentElement as HTMLAnchorElement
          link.target = "_blank"
          link.rel = "noopener noreferrer"
          link.style.color = "#2563eb"
          link.style.textDecoration = "underline"
        }
      }
    }

    setShowLinkModal(false)
    setLinkUrl("")
    setLinkText("")
  }

  const openTableModal = () => {
    saveSelection()
    setTableRows(3)
    setTableCols(3)
    setShowTableModal(true)
  }

  const insertTable = () => {
    restoreSelection()
    editorRef.current?.focus()

    const table = document.createElement("table")
    table.style.width = "100%"
    table.style.borderCollapse = "collapse"
    table.style.margin = "1rem 0"

    for (let i = 0; i < tableRows; i++) {
      const row = document.createElement("tr")
      for (let j = 0; j < tableCols; j++) {
        const cell = document.createElement(i === 0 ? "th" : "td")
        cell.style.border = "1px solid #d1d5db"
        cell.style.padding = "0.5rem"
        cell.style.textAlign = "left"
        if (i === 0) {
          cell.style.backgroundColor = "#f3f4f6"
          cell.style.fontWeight = "bold"
        }
        cell.innerHTML = "&nbsp;"
        row.appendChild(cell)
      }
      table.appendChild(row)
    }

    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.insertNode(table)
      range.setStartAfter(table)
      range.setEndAfter(table)
      selection.removeAllRanges()
      selection.addRange(range)
    } else if (editorRef.current) {
      editorRef.current.appendChild(table)
    }

    setShowTableModal(false)
  }

  const addTableRow = () => {
    const selection = window.getSelection()
    if (selection && selection.anchorNode) {
      let cell = selection.anchorNode as HTMLElement
      while (cell && cell.tagName !== "TD" && cell.tagName !== "TH") {
        cell = cell.parentElement as HTMLElement
      }
      if (cell) {
        const row = cell.parentElement as HTMLTableRowElement
        const table = row.parentElement as HTMLTableElement
        const newRow = document.createElement("tr")
        const colCount = row.cells.length

        for (let i = 0; i < colCount; i++) {
          const newCell = document.createElement("td")
          newCell.style.border = "1px solid #d1d5db"
          newCell.style.padding = "0.5rem"
          newCell.style.textAlign = "left"
          newCell.innerHTML = "&nbsp;"
          newRow.appendChild(newCell)
        }

        row.after(newRow)
      }
    }
  }

  const addTableColumn = () => {
    const selection = window.getSelection()
    if (selection && selection.anchorNode) {
      let cell = selection.anchorNode as HTMLElement
      while (cell && cell.tagName !== "TD" && cell.tagName !== "TH") {
        cell = cell.parentElement as HTMLElement
      }
      if (cell) {
        const row = cell.parentElement as HTMLTableRowElement
        const table = row.parentElement as HTMLTableElement
        const cellIndex = (cell as HTMLTableCellElement).cellIndex

        Array.from(table.rows).forEach((tableRow, rowIndex) => {
          const newCell = document.createElement(rowIndex === 0 ? "th" : "td")
          newCell.style.border = "1px solid #d1d5db"
          newCell.style.padding = "0.5rem"
          newCell.style.textAlign = "left"
          if (rowIndex === 0) {
            newCell.style.backgroundColor = "#f3f4f6"
            newCell.style.fontWeight = "bold"
          }
          newCell.innerHTML = "&nbsp;"
          if (cellIndex + 1 < tableRow.cells.length) {
            tableRow.cells[cellIndex + 1].before(newCell)
          } else {
            tableRow.appendChild(newCell)
          }
        })
      }
    }
  }

  const deleteTableRow = () => {
    const selection = window.getSelection()
    if (selection && selection.anchorNode) {
      let cell = selection.anchorNode as HTMLElement
      while (cell && cell.tagName !== "TD" && cell.tagName !== "TH") {
        cell = cell.parentElement as HTMLElement
      }
      if (cell) {
        const row = cell.parentElement as HTMLTableRowElement
        const table = row.parentElement as HTMLTableElement
        if (table.rows.length > 1) {
          row.remove()
        }
      }
    }
  }

  const deleteTableColumn = () => {
    const selection = window.getSelection()
    if (selection && selection.anchorNode) {
      let cell = selection.anchorNode as HTMLElement
      while (cell && cell.tagName !== "TD" && cell.tagName !== "TH") {
        cell = cell.parentElement as HTMLElement
      }
      if (cell) {
        const row = cell.parentElement as HTMLTableRowElement
        const table = row.parentElement as HTMLTableElement
        const cellIndex = (cell as HTMLTableCellElement).cellIndex

        if (row.cells.length > 1) {
          Array.from(table.rows).forEach((tableRow) => {
            if (tableRow.cells[cellIndex]) {
              tableRow.cells[cellIndex].remove()
            }
          })
        }
      }
    }
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
          <CardDescription>이미지, 테이블, 링크를 삽입하고 텍스트를 작성할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar Row 1 - Text Formatting */}
          <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("bold")}
              title="굵게"
            >
              <strong>B</strong>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("italic")}
              title="기울임"
            >
              <em>I</em>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("underline")}
              title="밑줄"
            >
              <u>U</u>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("strikeThrough")}
              title="취소선"
            >
              <s>S</s>
            </Button>
            <div className="w-px h-6 bg-gray-300 self-center" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFormatBlock("h1")}
              title="제목 1"
            >
              H1
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFormatBlock("h2")}
              title="제목 2"
            >
              H2
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFormatBlock("h3")}
              title="제목 3"
            >
              H3
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFormatBlock("h4")}
              title="제목 4"
            >
              H4
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFormatBlock("p")}
              title="본문"
            >
              P
            </Button>
            <div className="w-px h-6 bg-gray-300 self-center" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("insertUnorderedList")}
              title="글머리 목록"
            >
              • 목록
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("insertOrderedList")}
              title="번호 목록"
            >
              1. 목록
            </Button>
            <div className="w-px h-6 bg-gray-300 self-center" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("justifyLeft")}
              title="왼쪽 정렬"
            >
              ◀
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("justifyCenter")}
              title="가운데 정렬"
            >
              ◆
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("justifyRight")}
              title="오른쪽 정렬"
            >
              ▶
            </Button>
          </div>

          {/* Toolbar Row 2 - Insert Elements */}
          <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="이미지 삽입"
            >
              {isUploading ? "업로드 중..." : "🖼️ 이미지"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openLinkModal}
              title="링크 삽입"
            >
              🔗 링크
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openTableModal}
              title="테이블 삽입"
            >
              📊 테이블 삽입
            </Button>
            <div className="w-px h-6 bg-gray-300 self-center" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTableRow}
              title="행 추가"
            >
              + 행
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTableColumn}
              title="열 추가"
            >
              + 열
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={deleteTableRow}
              title="행 삭제"
            >
              - 행
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={deleteTableColumn}
              title="열 삭제"
            >
              - 열
            </Button>
            <div className="w-px h-6 bg-gray-300 self-center" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => execCommand("insertHorizontalRule")}
              title="구분선 삽입"
            >
              ─ 구분선
            </Button>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[500px] p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 prose prose-lg max-w-none bg-white [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mb-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-100 [&_a]:text-blue-600 [&_a]:underline"
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

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">링크 삽입</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="linkText">표시 텍스트</Label>
                <Input
                  id="linkText"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="링크에 표시될 텍스트"
                />
              </div>
              <div>
                <Label htmlFor="linkUrl">URL</Label>
                <Input
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowLinkModal(false)}>
                  취소
                </Button>
                <Button onClick={insertLink}>
                  삽입
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">테이블 삽입</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tableRows">행 수</Label>
                <Input
                  id="tableRows"
                  type="number"
                  min={1}
                  max={20}
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="tableCols">열 수</Label>
                <Input
                  id="tableCols"
                  type="number"
                  min={1}
                  max={10}
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTableModal(false)}>
                  취소
                </Button>
                <Button onClick={insertTable}>
                  삽입
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
