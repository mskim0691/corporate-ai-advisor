"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

interface Inquiry {
  id: string
  userId: string
  title: string
  content: string
  reply: string | null
  repliedAt: Date | null
  status: string
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    email: string
    name: string | null
  }
}

interface CustomerServiceClientProps {
  initialInquiries: Inquiry[]
}

export function CustomerServiceClient({ initialInquiries }: CustomerServiceClientProps) {
  const router = useRouter()
  const [inquiries] = useState(initialInquiries)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitReply = async (inquiryId: string) => {
    if (!replyText.trim()) {
      alert('답변 내용을 입력해주세요')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      })

      if (response.ok) {
        alert('답변이 성공적으로 등록되었습니다')
        setReplyText('')
        setReplyingTo(null)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || '답변 등록에 실패했습니다')
      }
    } catch (error) {
      console.error('Submit reply error:', error)
      alert('답변 등록 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  if (inquiries.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          등록된 문의가 없습니다
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inquiry) => (
        <Card
          key={inquiry.id}
          className={`border-l-4 ${
            inquiry.status === 'answered'
              ? 'border-l-green-500 bg-green-50'
              : 'border-l-orange-500 bg-orange-50'
          }`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl">{inquiry.title}</CardTitle>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded ${
                      inquiry.status === 'answered'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {inquiry.status === 'answered' ? '답변완료' : '답변대기'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">사용자:</span>{" "}
                    {inquiry.user.name || '이름 없음'} ({inquiry.user.email})
                  </p>
                  <p>
                    <span className="font-semibold">문의일시:</span>{" "}
                    {new Date(inquiry.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 문의 내용 */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">문의 내용</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {inquiry.content}
              </p>
            </div>

            {/* 답변 */}
            {inquiry.reply ? (
              <div className="bg-green-100 p-4 rounded-lg border border-green-300">
                <h3 className="font-semibold text-green-900 mb-2">답변</h3>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {inquiry.reply}
                </p>
                {inquiry.repliedAt && (
                  <p className="text-xs text-green-700 mt-2">
                    답변일시: {new Date(inquiry.repliedAt).toLocaleString("ko-KR")}
                  </p>
                )}
              </div>
            ) : replyingTo === inquiry.id ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <h3 className="font-semibold text-blue-900 mb-3">답변 작성</h3>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="답변 내용을 입력하세요"
                  rows={6}
                  disabled={submitting}
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSubmitReply(inquiry.id)}
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? '등록 중...' : '답변 등록'}
                  </Button>
                  <Button
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyText('')
                    }}
                    variant="outline"
                    disabled={submitting}
                  >
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Button
                  onClick={() => setReplyingTo(inquiry.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  답변하기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
