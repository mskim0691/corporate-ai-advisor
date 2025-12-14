"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
  const router = useRouter()

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

  const pendingCount = inquiries.filter(i => i.status === 'pending').length

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push('/qna')}
    >
      <CardHeader>
        <CardTitle>1:1 고객센터</CardTitle>
        <CardDescription>
          궁금하신 사항을 문의해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            등록된 문의가 없습니다
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mb-3">
              <p className="text-sm text-gray-600">
                총 {inquiries.length}건의 문의 (답변 대기: {pendingCount}건)
              </p>
            </div>
            {inquiries.slice(0, 5).map((inquiry) => (
              <div
                key={inquiry.id}
                className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 truncate flex-1 mr-2">
                    {inquiry.title}
                  </h4>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${
                      inquiry.status === 'answered'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {inquiry.status === 'answered' ? '답변완료' : '답변대기'}
                  </span>
                </div>
              </div>
            ))}
            {inquiries.length > 5 && (
              <p className="text-xs text-gray-500 text-center pt-2">
                +{inquiries.length - 5}개 더보기
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
