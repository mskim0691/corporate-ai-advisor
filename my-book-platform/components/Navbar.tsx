'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // 현재 사용자 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          📚 나의 독서 기록
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/books" className="text-gray-700 hover:text-blue-600">
            책 찾기
          </Link>
          
          {user ? (
            <>
              <Link href="/my-books" className="text-gray-700 hover:text-blue-600">
                내 서재
              </Link>
              <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                프로필
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}