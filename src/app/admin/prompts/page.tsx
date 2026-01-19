"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Prompt {
  id: string
  name: string
  content: string
  description: string | null
  updatedAt: string
  createdAt: string
}

// 기본 followup_analysis 프롬프트 템플릿
const DEFAULT_FOLLOWUP_PROMPT = `당신은 전문 B2B 영업 컨설턴트입니다. 아래 정보를 바탕으로 후속 미팅 대응 전략을 제안해주세요.

[회사 정보]
- 회사명: {{companyName}}
- 사업자번호: {{businessNumber}}
- 대표자: {{representative}}
{{#if industry}}- 업종: {{industry}}{{/if}}

[기존 분석 제안서 내용 요약]
{{textAnalysisSummary}}

[고객 미팅 결과]
{{meetingNotes}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 응답 형식 지침 (매우 중요!)

반드시 아래의 마크다운 문법을 사용해서 작성하세요:

1. **대제목**: \`## 제목\` 형식 (샵 2개 + 공백 + 제목)
2. **소제목**: \`### 제목\` 형식 (샵 3개 + 공백 + 제목)
3. **리스트**: \`- 항목\` 또는 \`1. 항목\` 형식
4. **강조**: \`**굵은 글씨**\` 형식
5. **인용문**: \`> 인용 내용\` 형식
6. **구분선**: \`---\` 형식

## 예시 출력 형식:

## 1. 미팅 결과 분석

### 1.1 고객의 주요 관심사항

- **비용 절감**: 현재 운영비 대비 30% 절감 가능성에 관심
- **도입 기간**: 빠른 도입을 희망함

> 고객은 특히 ROI에 대한 구체적인 수치를 원하고 있습니다.

### 1.2 긍정적인 신호

1. 대표님이 직접 미팅에 참석
2. 구체적인 견적 요청

---

## 작성해야 할 섹션:

## 1. 미팅 결과 분석
### 1.1 고객의 주요 관심사항
### 1.2 긍정적인 신호
### 1.3 우려 사항
### 1.4 의사결정 단계 평가

## 2. 고객 우려사항 대응 전략
### 2.1 우려사항별 대응 방안
### 2.2 활용 가능한 레퍼런스
### 2.3 예상 반론 및 답변

## 3. 후속 액션 플랜
### 3.1 다음 미팅 준비사항
### 3.2 추가 자료 및 데모 제안
### 3.3 의사결정권자 참여 유도

## 4. 제안 조정 사항
### 4.1 강조 포인트
### 4.2 수정/보완 필요사항
### 4.3 고객 맞춤형 추가 제안

## 5. 협상 전략
### 5.1 예상 협상 포인트
### 5.2 양보 가능/불가능 영역
### 5.3 계약 성사 핵심 전략

---

위 섹션들을 모두 포함하여 실용적이고 구체적인 조언을 작성해주세요.
각 섹션에서 반드시 \`##\`, \`###\` 헤더와 \`-\` 리스트, \`>\` 인용문, \`---\` 구분선을 적극 활용하세요.`

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
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
    console.log('handleEdit called for prompt:', prompt.name)
    console.log('Setting editingId to:', prompt.id)
    setEditingId(prompt.id)
    setEditForm({
      name: prompt.name,
      content: prompt.content,
      description: prompt.description || ''
    })
    console.log('State update called')

    // 편집 폼으로 스크롤
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
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
    setIsCreating(false)
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create prompt')
      }

      await fetchPrompts()
      setIsCreating(false)
      setEditForm({ name: '', content: '', description: '' })
      alert('프롬프트가 생성되었습니다')
    } catch (err) {
      alert('생성 실패: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleStartCreate = (useDefault = false) => {
    setIsCreating(true)
    setEditingId(null)
    if (useDefault) {
      setEditForm({
        name: 'followup_analysis',
        content: DEFAULT_FOLLOWUP_PROMPT,
        description: '후속 미팅 대응 분석 프롬프트 - 미팅 결과를 바탕으로 후속 전략 생성'
      })
    } else {
      setEditForm({ name: '', content: '', description: '' })
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
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

  console.log('Render: editingId =', editingId)

  // followup_analysis 프롬프트가 있는지 확인
  const hasFollowupPrompt = prompts.some(p => p.name === 'followup_analysis')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">프롬프트 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            AI 분석에 사용되는 프롬프트를 편집합니다
          </p>
        </div>
        <div className="flex gap-2">
          {!hasFollowupPrompt && (
            <Button
              onClick={() => handleStartCreate(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              followup_analysis 기본 템플릿 생성
            </Button>
          )}
          <Button onClick={() => handleStartCreate(false)}>
            새 프롬프트 추가
          </Button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(editingId || isCreating) && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isCreating ? '새 프롬프트 추가' : '프롬프트 편집'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 (식별자)
              </label>
              <Input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="예: followup_analysis, initial_risk"
                disabled={!isCreating} // 기존 프롬프트는 이름 변경 불가
              />
              {isCreating && (
                <p className="text-xs text-gray-500 mt-1">
                  사용 가능한 변수: {`{{companyName}}, {{businessNumber}}, {{representative}}, {{industry}}, {{textAnalysisSummary}}, {{meetingNotes}}`}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <Input
                type="text"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="프롬프트 설명"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프롬프트 내용
              </label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={15}
                placeholder="프롬프트 내용을 입력하세요"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={isCreating ? handleCreate : handleSave}>
                {isCreating ? '생성' : '저장'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
              >
                취소
              </Button>
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
                <Button
                  onClick={() => handleEdit(prompt)}
                  size="sm"
                >
                  편집
                </Button>
                <Button
                  onClick={() => handleDelete(prompt.id)}
                  variant="destructive"
                  size="sm"
                >
                  삭제
                </Button>
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
