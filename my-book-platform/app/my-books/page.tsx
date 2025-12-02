'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { ReadingRecord } from '@/types/database'

interface BookWithRecord extends ReadingRecord {
  books: {
    id: string
    title: string
    author: string
    cover_image: string
    isbn: string
  }
}

export default function MyBooksPage() {
  const router = useRouter()
  const [records, setRecords] = useState<BookWithRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<BookWithRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth')
      return
    }
    
    setUser(user)
    loadRecords(user.id)
  }

  const loadRecords = async (userId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reading_records')
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image,
            isbn
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      setRecords(data || [])
      setFilteredRecords(data || [])
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterRecords = (status: string) => {
    setActiveFilter(status)
    if (status === 'all') {
      setFilteredRecords(records)
    } else {
      setFilteredRecords(records.filter(record => record.status === status))
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      want_to_read: { text: '읽고 싶음', color: 'bg-blue-100 text-blue-800' },
      reading: { text: '읽는 중', color: 'bg-green-100 text-green-800' },
      completed: { text: '완독', color: 'bg-purple-100 text-purple-800' },
    }
    return badges[status as keyof typeof badges] || badges.want_to_read
  }

  const stats = {
    total: records.length,
    want_to_read: records.filter(r => r.status === 'want_to_read').length,
    reading: records.filter(r => r.status === 'reading').length,
    completed: records.filter(r => r.status === 'completed').length,
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-xl">로딩 중...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">내 서재 📚</h1>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">전체</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4">
              <p className="text-blue-600 text-sm">읽고 싶음</p>
              <p className="text-3xl font-bold text-blue-900">{stats.want_to_read}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4">
              <p className="text-green-600 text-sm">읽는 중</p>
              <p className="text-3xl font-bold text-green-900">{stats.reading}</p>
            </div>
            <div className="bg-purple-50 rounded-lg shadow p-4">
              <p className="text-purple-600 text-sm">완독</p>
              <p className="text-3xl font-bold text-purple-900">{stats.completed}</p>
            </div>
          </div>

          {/* 필터 버튼 */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => filterRecords('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              전체 ({stats.total})
            </button>
            <button
              onClick={() => filterRecords('want_to_read')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeFilter === 'want_to_read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              읽고 싶음 ({stats.want_to_read})
            </button>
            <button
              onClick={() => filterRecords('reading')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeFilter === 'reading'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              읽는 중 ({stats.reading})
            </button>
            <button
              onClick={() => filterRecords('completed')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeFilter === 'completed'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              완독 ({stats.completed})
            </button>
          </div>

          {/* 책 목록 */}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-4">
                아직 등록된 책이 없습니다.
              </p>
              <button
                onClick={() => router.push('/books')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                책 찾으러 가기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => router.push(`/books/${record.books.isbn}`)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
                >
                  {/* 책 표지 */}
                  <div className="relative h-64 bg-gray-100">
                    <Image
                      src={record.books.cover_image || '/placeholder-book.png'}
                      alt={record.books.title}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  {/* 책 정보 */}
                  <div className="p-3">
                    {/* 상태 뱃지 */}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        getStatusBadge(record.status).color
                      }`}
                    >
                      {getStatusBadge(record.status).text}
                    </span>

                    {/* 제목 */}
                    <h3 className="font-semibold text-sm mt-2 line-clamp-2">
                      {record.books.title}
                    </h3>
                    
                    {/* 저자 */}
                    <p className="text-xs text-gray-600 mt-1">
                      {record.books.author}
                    </p>

                    {/* 별점 */}
                    {record.rating && (
                      <div className="flex items-center mt-2">
                        <span className="text-yellow-500 text-sm">
                          {'⭐'.repeat(record.rating)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          {record.rating}.0
                        </span>
                      </div>
                    )}

                    {/* 리뷰 미리보기 */}
                    {record.review && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {record.review}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}