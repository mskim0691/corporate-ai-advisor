'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import ReadingChart from '@/components/ReadingChart'

interface UserProfile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
}

interface ReadingStats {
  totalBooks: number
  completedBooks: number
  readingBooks: number
  wantToReadBooks: number
  averageRating: number
  totalPages: number
  booksThisMonth: number
  booksThisYear: number
  monthlyData: { month: string; count: number }[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<ReadingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  
  // 편집 폼 상태
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

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
    loadProfile(user.id)
    loadStats(user.id)
  }

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      setProfile(data)
      setDisplayName(data.display_name || '')
      setBio(data.bio || '')
    } catch (error) {
      console.error('프로필 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (userId: string) => {
    try {
      const { data: records, error } = await supabase
        .from('reading_records')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()

      const totalBooks = records?.length || 0
      const completedBooks = records?.filter(r => r.status === 'completed').length || 0
      const readingBooks = records?.filter(r => r.status === 'reading').length || 0
      const wantToReadBooks = records?.filter(r => r.status === 'want_to_read').length || 0

      // 평균 별점 계산
      const ratedBooks = records?.filter(r => r.rating) || []
      const averageRating = ratedBooks.length > 0
        ? ratedBooks.reduce((sum, r) => sum + (r.rating || 0), 0) / ratedBooks.length
        : 0

      // 이번 달 읽은 책
      const booksThisMonth = records?.filter(r => {
        if (!r.completed_at) return false
        const completedDate = new Date(r.completed_at)
        return completedDate.getMonth() === thisMonth && completedDate.getFullYear() === thisYear
      }).length || 0

      // 올해 읽은 책
      const booksThisYear = records?.filter(r => {
        if (!r.completed_at) return false
        const completedDate = new Date(r.completed_at)
        return completedDate.getFullYear() === thisYear
      }).length || 0

      // 월별 독서량 계산
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        const month = date.toLocaleDateString('ko-KR', { month: 'short' })
        
        const count = records?.filter(r => {
          if (!r.completed_at) return false
          const completedDate = new Date(r.completed_at)
          return (
            completedDate.getMonth() === date.getMonth() &&
            completedDate.getFullYear() === date.getFullYear()
          )
        }).length || 0
        
        return { month, count }
      })

      setStats({
        totalBooks,
        completedBooks,
        readingBooks,
        wantToReadBooks,
        averageRating,
        totalPages: 0,
        booksThisMonth,
        booksThisYear,
        monthlyData,
      })
    } catch (error) {
      console.error('통계 로드 실패:', error)
    }
  }

  const saveProfile = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName,
          bio: bio,
        })
        .eq('id', user.id)

      if (error) throw error

      alert('프로필이 저장되었습니다!')
      setEditing(false)
      loadProfile(user.id)
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
          <p className="text-xl">로딩 중...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* 프로필 카드 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profile?.display_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{profile?.display_name || profile?.username}</h1>
                  <p className="text-gray-600">@{profile?.username}</p>
                  <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                </div>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  프로필 수정
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm font-medium mb-1">표시 이름</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="표시할 이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">소개</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="자기소개를 입력하세요"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setDisplayName(profile?.display_name || '')
                      setBio(profile?.bio || '')
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {profile?.bio ? (
                  <p className="text-gray-700">{profile.bio}</p>
                ) : (
                  <p className="text-gray-400 italic">소개가 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {/* 독서 통계 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">📊 독서 통계</h2>

            {/* 주요 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <p className="text-blue-600 text-sm font-medium">전체 책</p>
                <p className="text-3xl font-bold text-blue-900">{stats?.totalBooks || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <p className="text-green-600 text-sm font-medium">완독</p>
                <p className="text-3xl font-bold text-green-900">{stats?.completedBooks || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
                <p className="text-yellow-600 text-sm font-medium">읽는 중</p>
                <p className="text-3xl font-bold text-yellow-900">{stats?.readingBooks || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <p className="text-purple-600 text-sm font-medium">평균 별점</p>
                <p className="text-3xl font-bold text-purple-900">
                  {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                </p>
              </div>
            </div>

            {/* 기간별 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">이번 달</h3>
                  <span className="text-2xl">📅</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.booksThisMonth || 0} <span className="text-sm font-normal text-gray-600">권 완독</span>
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">올해</h3>
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.booksThisYear || 0} <span className="text-sm font-normal text-gray-600">권 완독</span>
                </p>
              </div>
            </div>

            {/* 독서 진행률 */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">완독률</h3>
                <span className="text-sm text-gray-600">
                  {stats?.totalBooks ? Math.round((stats.completedBooks / stats.totalBooks) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${stats?.totalBooks ? (stats.completedBooks / stats.totalBooks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* 읽고 싶은 책 */}
            {stats && stats.wantToReadBooks > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-900">
                  <span className="font-semibold">{stats.wantToReadBooks}권</span>의 책이 당신을 기다리고 있어요! 📚
                </p>
              </div>
            )}
          </div>

          {/* 월별 독서량 차트 */}
          {stats?.monthlyData && (
            <ReadingChart data={stats.monthlyData} />
          )}
        </div>
      </div>
    </>
  )
}