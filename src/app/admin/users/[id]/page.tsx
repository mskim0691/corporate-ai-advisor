"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

interface UserDetail {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  subscription: {
    id: string
    plan: string
    status: string
    currentPeriodEnd: string | null
  } | null
  usageLogs: {
    yearMonth: string
    count: number
  }[]
  projects: {
    id: string
    companyName: string
    status: string
    createdAt: string
    _count: {
      files: number
    }
    report: {
      id: string
      createdAt: string
      viewCount: number
    } | null
  }[]
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editRole, setEditRole] = useState("")
  const [editPlan, setEditPlan] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchUser()
    }
  }, [params.id])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch user')
      const data = await response.json()
      setUser(data.user)
      setEditRole(data.user.role)
      setEditPlan(data.user.subscription?.plan || 'free')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          subscriptionPlan: editPlan
        })
      })

      if (!response.ok) throw new Error('Failed to update user')

      await fetchUser()
      setEditing(false)
      alert('회원 정보가 업데이트되었습니다')
    } catch (err) {
      alert('업데이트 실패: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleDelete = async () => {
    if (!confirm(`정말로 ${user?.name || user?.email} 회원을 탈퇴 처리하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 회원의 모든 데이터(프로젝트, 구독 정보 등)가 영구적으로 삭제됩니다.`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete user')

      alert('회원이 성공적으로 삭제되었습니다')
      router.push('/admin/users')
    } catch (err) {
      alert('삭제 실패: ' + (err instanceof Error ? err.message : 'Unknown error'))
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">오류: {error || 'User not found'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/users" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
            ← 회원 목록으로
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{user.name || '이름 없음'}</h1>
          <p className="mt-2 text-sm text-gray-600">{user.email}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => editing ? handleUpdate() : setEditing(true)}
            disabled={deleting}
          >
            {editing ? '저장' : '수정'}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {deleting ? '처리중...' : '탈퇴'}
          </Button>
        </div>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">이메일</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">이름</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">역할</dt>
              <dd className="mt-1">
                {editing ? (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="user">사용자</option>
                    <option value="admin">관리자</option>
                  </select>
                ) : (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'admin' ? '관리자' : '사용자'}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">가입일</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">구독 정보</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">구독 플랜</dt>
              <dd className="mt-1">
                {editing ? (
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                ) : (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.subscription?.plan === 'pro'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.subscription?.plan === 'pro' ? 'Pro' : 'Free'}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">상태</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.subscription?.status || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">구독 종료일</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.subscription?.currentPeriodEnd
                  ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
                  : '-'
                }
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Projects */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          프로젝트 ({user.projects.length}개)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  회사명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  파일 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  조회수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  생성일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {user.projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {project.companyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      project.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status === 'completed' ? '완료' :
                       project.status === 'processing' ? '처리중' :
                       project.status === 'failed' ? '실패' : '대기'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project._count.files}개
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.report?.viewCount || 0}회
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Usage Logs */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">사용량</h2>
        <div className="space-y-2">
          {user.usageLogs.map((log) => (
            <div key={log.yearMonth} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">{log.yearMonth}</span>
              <span className="text-sm font-medium text-gray-900">{log.count}회</span>
            </div>
          ))}
          {user.usageLogs.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">사용 내역이 없습니다</p>
          )}
        </div>
      </Card>
    </div>
  )
}
