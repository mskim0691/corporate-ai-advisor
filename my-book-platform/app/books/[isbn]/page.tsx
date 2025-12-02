'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Navbar from '@/components/Navbar'

interface BookDetail {
  title: string
  author: string
  cover: string
  isbn13: string
  publisher: string
  pubDate: string
  description: string
  priceStandard: number
}

interface ReadingRecord {
  id: string
  status: string
  rating: number | null
  review: string | null
  notes: string | null
}

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isbn = params.isbn as string

  const [book, setBook] = useState<BookDetail | null>(null)
  const [record, setRecord] = useState<ReadingRecord | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // 독서 기록 입력 상태
  const [status, setStatus] = useState<string>('want_to_read')
  const [rating, setRating] = useState<number>(0)
  const [review, setReview] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadBookAndRecord()
  }, [isbn])

  const loadBookAndRecord = async () => {
    try {
      // 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // 책 정보 가져오기 (자체 API 라우트 사용)
      const response = await fetch(`/api/book/${isbn}`)
      const data = await response.json()
      if (data.item && data.item.length > 0) {
        setBook(data.item[0])
      }

      // 독서 기록 확인 (있으면 가져오기)
      if (user) {
        // 먼저 DB에서 책 정보 확인
        const { data: existingBook } = await supabase
          .from('books')
          .select('id')
          .eq('isbn', isbn)
          .single()

        if (existingBook) {
          // 독서 기록 확인
          const { data: existingRecord } = await supabase
            .from('reading_records')
            .select('*')
            .eq('book_id', existingBook.id)
            .eq('user_id', user.id)
            .single()

          if (existingRecord) {
            setRecord(existingRecord)
            setStatus(existingRecord.status)
            setRating(existingRecord.rating || 0)
            setReview(existingRecord.review || '')
            setNotes(existingRecord.notes || '')
          }
        }
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveRecord = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/auth')
      return
    }

    if (!book) return

    setSaving(true)
    try {
      // 1. 책 정보 저장 (없으면 생성)
      const { data: existingBook, error: bookCheckError } = await supabase
        .from('books')
        .select('id')
        .eq('isbn', isbn)
        .single()

      let bookId: string

      if (existingBook) {
        bookId = existingBook.id
      } else {
        const { data: newBook, error: bookError } = await supabase
          .from('books')
          .insert({
            title: book.title,
            author: book.author,
            isbn: isbn,
            cover_image: book.cover,
            publisher: book.publisher,
            published_date: book.pubDate,
            description: book.description,
          })
          .select()
          .single()

        if (bookError) throw bookError
        bookId = newBook.id
      }

      // 2. 독서 기록 저장 (있으면 업데이트, 없으면 생성)
      const recordData = {
        user_id: user.id,
        book_id: bookId,
        status: status,
        rating: rating > 0 ? rating : null,
        review: review || null,
        notes: notes || null,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        started_at: status === 'reading' ? new Date().toISOString() : null,
      }

      if (record) {
        // 업데이트
        const { error } = await supabase
          .from('reading_records')
          .update(recordData)
          .eq('id', record.id)

        if (error) throw error
      } else {
        // 새로 생성
        const { error } = await supabase
          .from('reading_records')
          .insert(recordData)

        if (error) throw error
      }

      alert('저장되었습니다!')
      loadBookAndRecord() // 새로고침
    } catch (error: any) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p>로딩 중...</p>
        </div>
      </>
    )
  }

  if (!book) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p>책 정보를 찾을 수 없습니다.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* 책 정보 섹션 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex gap-6">
              {/* 책 표지 */}
              <div className="flex-shrink-0">
                <div className="relative w-48 h-64">
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* 책 정보 */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
                <p className="text-xl text-gray-600 mb-4">{book.author}</p>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-semibold">출판사:</span> {book.publisher}</p>
                  <p><span className="font-semibold">출간일:</span> {book.pubDate}</p>
                  <p><span className="font-semibold">ISBN:</span> {book.isbn13}</p>
                  {book.priceStandard && (
                    <p><span className="font-semibold">정가:</span> {book.priceStandard.toLocaleString()}원</p>
                  )}
                </div>
                {book.description && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">책 소개</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {book.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 독서 기록 섹션 */}
          {user && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">나의 독서 기록</h2>

              {/* 읽기 상태 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">읽기 상태</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus('want_to_read')}
                    className={`px-4 py-2 rounded-lg ${
                      status === 'want_to_read'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    읽고 싶음
                  </button>
                  <button
                    onClick={() => setStatus('reading')}
                    className={`px-4 py-2 rounded-lg ${
                      status === 'reading'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    읽는 중
                  </button>
                  <button
                    onClick={() => setStatus('completed')}
                    className={`px-4 py-2 rounded-lg ${
                      status === 'completed'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    완독
                  </button>
                </div>
              </div>

              {/* 별점 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">별점</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="text-3xl focus:outline-none"
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 리뷰 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">리뷰</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="이 책에 대한 생각을 공유해주세요..."
                />
              </div>

              {/* 메모 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">개인 메모</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="나만 볼 수 있는 메모..."
                />
              </div>

              {/* 저장 버튼 */}
              <button
                onClick={saveRecord}
                disabled={saving}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
              >
                {saving ? '저장 중...' : record ? '수정하기' : '저장하기'}
              </button>
            </div>
          )}

          {!user && (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <p className="text-gray-700 mb-4">독서 기록을 남기려면 로그인이 필요합니다.</p>
              <button
                onClick={() => router.push('/auth')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                로그인하기
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}