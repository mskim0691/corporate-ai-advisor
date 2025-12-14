"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface Inquiry {
  id: string
  title: string
  content: string
  reply: string | null
  repliedAt: Date | null
  status: string
  createdAt: Date
  updatedAt: Date
}

interface QnaClientProps {
  inquiries: Inquiry[]
}

export default function QnaClient({ inquiries: initialInquiries }: QnaClientProps) {
  const [inquiries, setInquiries] = useState(initialInquiries)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit inquiry")
      }

      const data = await response.json()

      alert("문의가 성공적으로 등록되었습니다.")

      setTitle("")
      setContent("")
      setShowNewForm(false)
      router.refresh()
    } catch (error) {
      console.error("Submit error:", error)
      alert("문의 등록 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">1:1 고객센터</h1>
        <p className="text-gray-600">궁금하신 사항을 문의해주세요. 관리자가 확인 후 답변드립니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Inquiry List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">문의 내역</h2>
            <Button onClick={() => setShowNewForm(!showNewForm)}>
              {showNewForm ? "취소" : "새 문의 작성"}
            </Button>
          </div>

          {showNewForm && (
            <Card>
              <CardHeader>
                <CardTitle>새 문의 작성</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="제목을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="문의 내용을 입력하세요"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={isSubmitting}
                      rows={6}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "등록 중..." : "문의 등록"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {inquiries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  아직 문의 내역이 없습니다.
                </CardContent>
              </Card>
            ) : (
              inquiries.map((inquiry) => (
                <Card
                  key={inquiry.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedInquiry?.id === inquiry.id ? "border-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedInquiry(inquiry)}
                >
                  <CardContent className="py-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{inquiry.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(inquiry.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                          inquiry.status === "answered"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {inquiry.status === "answered" ? "답변완료" : "답변대기"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right: Inquiry Detail */}
        <div>
          {selectedInquiry ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start gap-3">
                  <CardTitle className="flex-1">{selectedInquiry.title}</CardTitle>
                  <span
                    className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                      selectedInquiry.status === "answered"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedInquiry.status === "answered" ? "답변완료" : "답변대기"}
                  </span>
                </div>
                <CardDescription>{formatDate(selectedInquiry.createdAt)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2 text-sm text-gray-700">문의 내용</h3>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedInquiry.content}
                  </div>
                </div>

                {selectedInquiry.reply && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm text-gray-700">관리자 답변</h3>
                    <div className="bg-blue-50 p-4 rounded-lg whitespace-pre-wrap border-l-4 border-blue-500">
                      {selectedInquiry.reply}
                    </div>
                    {selectedInquiry.repliedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        답변일시: {formatDate(selectedInquiry.repliedAt)}
                      </p>
                    )}
                  </div>
                )}

                {!selectedInquiry.reply && (
                  <div className="text-center py-8 text-gray-500">
                    관리자의 답변을 기다리고 있습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-gray-500">
                문의 내역을 선택하시면 상세 내용을 확인할 수 있습니다.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
