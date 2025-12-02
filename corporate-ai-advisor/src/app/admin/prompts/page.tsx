"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Prompt {
  id: string
  name: string
  content: string
  description: string | null
  updatedAt: string
  createdAt: string
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    content: '',
    description: ''
  })

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/admin/prompts')
      if (!response.ok) throw new Error('Failed to fetch prompts')
      const data = await response.json()

      // Sort prompts by name (step1, step2, step3)
      const sortedPrompts = [...data.prompts].sort((a, b) => {
        // Extract step number from name (e.g., "step1-..." -> 1)
        const getStepNumber = (name: string) => {
          const match = name.match(/step(\d+)/i)
          return match ? parseInt(match[1]) : 999
        }
        return getStepNumber(a.name) - getStepNumber(b.name)
      })

      setPrompts(sortedPrompts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingId(prompt.id)
    setEditForm({
      name: prompt.name,
      content: prompt.content,
      description: prompt.description || ''
    })
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/prompts/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) throw new Error('Failed to save prompt')

      await fetchPrompts()
      setEditingId(null)
      alert('프롬프트가 저장되었습니다')
    } catch (err) {
      alert('저장 실패: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 프롬프트를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/prompts/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete prompt')

      await fetchPrompts()
      alert('프롬프트가 삭제되었습니다')
    } catch (err) {
      alert('삭제 실패: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">오류: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">프롬프트 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          AI 분석에 사용되는 프롬프트를 편집합니다
        </p>
      </div>

      {/* Edit Form */}
      {editingId && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            프롬프트 편집
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 (식별자)
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="예: initial_risk, detailed_analysis"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                disabled // 기존 프롬프트는 이름 변경 불가
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <input
                type="text"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="프롬프트 설명"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프롬프트 내용
              </label>
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={15}
                placeholder="프롬프트 내용을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSave}>
                저장
              </Button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Prompts List */}
      <div className="grid grid-cols-1 gap-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{prompt.name}</h3>
                {prompt.description && (
                  <p className="text-sm text-gray-600 mt-1">{prompt.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  마지막 수정: {new Date(prompt.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(prompt)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  편집
                </button>
                <button
                  onClick={() => handleDelete(prompt.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                {prompt.content}
              </pre>
            </div>
          </Card>
        ))}
      </div>

      {prompts.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500">프롬프트가 없습니다.</p>
        </Card>
      )}
    </div>
  )
}
