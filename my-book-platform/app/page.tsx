'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Navbar from '@/components/Navbar'

interface RecentBook {
  id: string
  status: string
  rating: number | null
  books: {
    id: string
    title: string
    author: string
    cover_image: string
    isbn: string
  }
}

export default function Home() {
  const router = useRouter()
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // 최근 업데이트된 책 3권 가져오기
        const { data } = await supabase
          .from('reading_records')
          .select(`
            id,
            status,
            rating,
            books (
              id,
              title,
              author,
              cover_image,
              isbn
            )
          `)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(3)

        setRecentBooks(data || [])
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      want_to_read: '읽고 싶음',
      reading: '읽는 중',
      completed: '완독',
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              나의 독서 기록 📚
            </h1>
            <p className="text-gray-600">
              {user
                ? '오늘도 좋은 책과 함께하세요!'
                : '로그인하고 독서 기록을 시작하세요.'}
            </p>
          </div>

          {/* 사용자가 로그인한 경우 */}
          {user && (
            <>
              {/* 빠른 액션 버튼 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                  onClick={() => router.push('/books')}
                  className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition"
                >
                  <div className="text-3xl mb-2">🔍</div>
                  <div className="font-semibold text-lg">책 찾기</div>
                  <div className="text-sm opacity-90">새로운 책을 찾아보세요</div>
                </button>

                <button
                  onClick={() => router.push('/my-books')}
                  className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition"
                >
                  <div className="text-3xl mb-2">📚</div>
                  <div className="font-semibold text-lg">내 서재</div>
                  <div className="text-sm opacity-90">내 책들을 관리하세요</div>
                </button>

                <button
                  onClick={() => router.push('/profile')}
                  className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition"
                >
                  <div className="text-3xl mb-2">👤</div>
                  <div className="font-semibold text-lg">프로필</div>
                  <div className="text-sm opacity-90">내 정보를 확인하세요</div>
                </button>
              </div>

              {/* 최근 읽은 책 */}
              {recentBooks.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">최근 기록한 책</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recentBooks.map((record) => (
                      <div
                        key={record.id}
                        onClick={() => router.push(`/books/${record.books.isbn}`)}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden"
                      >
                        <div className="flex gap-4 p-4">
                          <div className="relative w-24 h-32 flex-shrink-0">
                            <Image
                              src={record.books.cover_image}
                              alt={record.books.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1 line-clamp-2">
                              {record.books.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {record.books.author}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                {getStatusText(record.status)}
                              </span>
                              {record.rating && (
                                <div className="flex items-center">
                                  <span className="text-yellow-500 text-sm">
                                    {'⭐'.repeat(record.rating)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 로그인하지 않은 경우 */}
          {!user && !loading && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📖</div>
              <h2 className="text-2xl font-bold mb-4">독서 기록을 시작하세요</h2>
              <p className="text-gray-600 mb-6">
                읽은 책을 기록하고, 리뷰를 작성하고, 통계를 확인하세요.
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold"
              >
                시작하기
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}