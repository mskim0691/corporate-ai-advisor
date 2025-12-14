"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface Inquiry {
  id: string
  title: string
  content: string
  reply: string | null
  status: string
  createdAt: string
  repliedAt: string | null
}

export function CustomerServiceSection() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      const response = await fetch('/api/inquiries')
      if (response.ok) {
        const data = await response.json()
        setInquiries(data.inquiries || [])
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })

      if (response.ok) {
        alert('문의가 성공적으로 등록되었습니다')
        setTitle('')
        setContent('')
        setShowForm(false)
        fetchInquiries()
      } else {
        const error = await response.json()
        alert(error.error || '문의 등록에 실패했습니다')
      }
    } catch (error) {
      console.error('Submit inquiry error:', error)
      alert('문의 등록 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = inquiries.filter(i => i.status === 'pending').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>고객센터</CardTitle>
            <CardDescription>
              궁금하신 사항을 문의해주세요
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {showForm ? '취소' : '문의하기'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="문의 제목을 입력하세요"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">내용</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="문의 내용을 입력하세요"
                rows={5}
                required
                disabled={submitting}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? '등록 중...' : '문의 등록'}
            </Button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            등록된 문의가 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                총 {inquiries.length}건의 문의 (답변 대기: {pendingCount}건)
              </p>
            </div>
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`p-4 rounded-lg border ${
                  inquiry.status === 'answered'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{inquiry.title}</h4>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      inquiry.status === 'answered'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {inquiry.status === 'answered' ? '답변완료' : '답변대기'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                  {inquiry.content}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  문의일시: {new Date(inquiry.createdAt).toLocaleString('ko-KR')}
                </p>
                {inquiry.reply && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <p className="text-xs font-semibold text-green-700 mb-1">관리자 답변:</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded">
                      {inquiry.reply}
                    </p>
                    {inquiry.repliedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        답변일시: {new Date(inquiry.repliedAt).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
