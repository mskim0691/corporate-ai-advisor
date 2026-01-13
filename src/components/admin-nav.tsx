"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"

export function AdminNav() {
  const [systemMenuOpen, setSystemMenuOpen] = useState(false)
  const [memberMenuOpen, setMemberMenuOpen] = useState(false)
  const systemMenuRef = useRef<HTMLDivElement>(null)
  const memberMenuRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (systemMenuRef.current && !systemMenuRef.current.contains(event.target as Node)) {
        setSystemMenuOpen(false)
      }
      if (memberMenuRef.current && !memberMenuRef.current.contains(event.target as Node)) {
        setMemberMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
      <Link
        href="/admin"
        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
      >
        어드민 대시보드
      </Link>

      <Link
        href="/admin/make-report"
        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
      >
        비주얼 레포트 제작
      </Link>

      {/* System Management Dropdown */}
      <div className="relative flex items-center" ref={systemMenuRef}>
        <button
          onClick={() => {
            setSystemMenuOpen(!systemMenuOpen)
            setMemberMenuOpen(false)
          }}
          className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
        >
          시스템 관리
          <svg className={`ml-1 h-4 w-4 transition-transform ${systemMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {systemMenuOpen && (
          <div className="absolute left-0 top-full w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              <Link
                href="/admin/projects"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setSystemMenuOpen(false)}
              >
                프로젝트 관리
              </Link>
              <Link
                href="/admin/prompts"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setSystemMenuOpen(false)}
              >
                프롬프트 관리
              </Link>
              <Link
                href="/admin/revenue"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setSystemMenuOpen(false)}
              >
                매출 통계
              </Link>
              <Link
                href="/admin/sample-reports"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setSystemMenuOpen(false)}
              >
                샘플 레포트 관리
              </Link>
              <Link
                href="/admin/banners"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setSystemMenuOpen(false)}
              >
                배너 관리
              </Link>
              <Link
                href="/admin/service-intro"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setSystemMenuOpen(false)}
              >
                서비스소개 관리
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Member Management Dropdown */}
      <div className="relative flex items-center" ref={memberMenuRef}>
        <button
          onClick={() => {
            setMemberMenuOpen(!memberMenuOpen)
            setSystemMenuOpen(false)
          }}
          className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
        >
          회원 관리
          <svg className={`ml-1 h-4 w-4 transition-transform ${memberMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {memberMenuOpen && (
          <div className="absolute left-0 top-full w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              <Link
                href="/admin/users"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setMemberMenuOpen(false)}
              >
                회원 리스트
              </Link>
              <Link
                href="/admin/policies"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setMemberMenuOpen(false)}
              >
                그룹 정책
              </Link>
              <Link
                href="/admin/pricing-plans"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setMemberMenuOpen(false)}
              >
                가격 플랜
              </Link>
            </div>
          </div>
        )}
      </div>

      <Link
        href="/admin/announcements"
        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
      >
        공지사항
      </Link>

      <Link
        href="/admin/customer-service"
        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
      >
        고객센터
      </Link>
    </div>
  )
}
