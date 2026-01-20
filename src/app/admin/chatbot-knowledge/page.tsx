'use client';

import { useEffect, useState } from 'react';

interface KnowledgeEntry {
  id: string;
  category: string;
  subcategory: string | null;
  question: string;
  answer: string;
  source: string;
  sourceUrl: string | null;
  keywords: string;
  isActive: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  '법인세',
  '가업승계',
  '퇴직금',
  '4대보험',
  '기업승계',
  '세무조사',
  '부가가치세',
  '원천세',
  '급여',
  '기타'
];

export default function ChatbotKnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    question: '',
    answer: '',
    source: '',
    sourceUrl: '',
    keywords: '',
    isActive: true,
    lastUpdated: new Date().toISOString().slice(0, 7) // YYYY-MM format
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/admin/chatbot-knowledge');
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/admin/chatbot-knowledge/${editingId}`
        : '/api/admin/chatbot-knowledge';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchEntries();
        resetForm();
        alert(editingId ? '지식이 수정되었습니다.' : '지식이 추가되었습니다.');
      } else {
        const error = await response.json();
        alert(error.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to save knowledge:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingId(entry.id);
    setFormData({
      category: entry.category,
      subcategory: entry.subcategory || '',
      question: entry.question,
      answer: entry.answer,
      source: entry.source,
      sourceUrl: entry.sourceUrl || '',
      keywords: entry.keywords,
      isActive: entry.isActive,
      lastUpdated: entry.lastUpdated
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 지식을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/chatbot-knowledge/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchEntries();
        alert('지식이 삭제되었습니다.');
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete knowledge:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleToggleActive = async (entry: KnowledgeEntry) => {
    try {
      const response = await fetch(`/api/admin/chatbot-knowledge/${entry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !entry.isActive }),
      });

      if (response.ok) {
        await fetchEntries();
      }
    } catch (error) {
      console.error('Failed to toggle active:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      subcategory: '',
      question: '',
      answer: '',
      source: '',
      sourceUrl: '',
      keywords: '',
      isActive: true,
      lastUpdated: new Date().toISOString().slice(0, 7)
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesCategory = !filterCategory || entry.category === filterCategory;
    const matchesSearch = !searchTerm ||
      entry.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.keywords.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group entries by category
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, KnowledgeEntry[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">챗봇 지식 베이스 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            AI 챗봇이 참조하는 지식 베이스를 관리합니다. 출처가 명확한 정보만 등록해주세요.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showForm ? '취소' : '새 지식 추가'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? '지식 수정' : '새 지식 추가'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  카테고리 *
                </label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택하세요</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                  서브카테고리
                </label>
                <input
                  type="text"
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 세율, 공제요건"
                />
              </div>
            </div>

            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                질문/주제 *
              </label>
              <input
                type="text"
                id="question"
                required
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 법인세 세율은 어떻게 되나요?"
              />
            </div>

            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
                답변 *
              </label>
              <textarea
                id="answer"
                required
                rows={6}
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="정확하고 상세한 답변을 입력하세요. 마크다운 형식을 지원합니다."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  출처 *
                </label>
                <input
                  type="text"
                  id="source"
                  required
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 국세청, 법인세법 제55조"
                />
              </div>

              <div>
                <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700">
                  출처 URL
                </label>
                <input
                  type="url"
                  id="sourceUrl"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
                검색 키워드 * (쉼표로 구분)
              </label>
              <input
                type="text"
                id="keywords"
                required
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 법인세, 세율, 과세표준, 세금"
              />
              <p className="mt-1 text-xs text-gray-500">
                사용자 질문에서 이 키워드가 포함되면 이 지식이 검색됩니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lastUpdated" className="block text-sm font-medium text-gray-700">
                  정보 기준일 *
                </label>
                <input
                  type="month"
                  id="lastUpdated"
                  required
                  value={formData.lastUpdated}
                  onChange={(e) => setFormData({ ...formData, lastUpdated: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  정보가 확인된 날짜 (세법 변경 시 업데이트 필요)
                </p>
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  활성화 (체크 시 챗봇이 참조합니다)
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingId ? '수정' : '추가'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="검색어 입력..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">모든 카테고리</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 flex gap-4 text-sm text-gray-600">
        <span>전체: {entries.length}개</span>
        <span>활성: {entries.filter(e => e.isActive).length}개</span>
        <span>필터 결과: {filteredEntries.length}개</span>
      </div>

      {/* Knowledge List */}
      <div className="space-y-6">
        {Object.entries(groupedEntries).map(([category, categoryEntries]) => (
          <div key={category} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {category} <span className="text-sm font-normal text-gray-500">({categoryEntries.length}개)</span>
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {categoryEntries.map((entry) => (
                <li key={entry.id} className={`p-6 hover:bg-gray-50 ${!entry.isActive ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-base font-medium text-gray-900">
                          {entry.question}
                        </h4>
                        {entry.subcategory && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            {entry.subcategory}
                          </span>
                        )}
                        {entry.isActive ? (
                          <span className="px-2 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                            활성
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                            비활성
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3 mb-2">
                        {entry.answer}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          출처: {entry.source}
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          기준: {entry.lastUpdated}
                        </span>
                        <span className="text-gray-400">
                          키워드: {entry.keywords}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-1">
                      <button
                        onClick={() => handleToggleActive(entry)}
                        className={`px-3 py-1 text-sm font-medium rounded ${
                          entry.isActive
                            ? 'text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100'
                            : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {entry.isActive ? '비활성화' : '활성화'}
                      </button>
                      <button
                        onClick={() => handleEdit(entry)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 rounded"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 rounded"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
          {entries.length === 0
            ? '등록된 지식이 없습니다. 새 지식을 추가해주세요.'
            : '검색 결과가 없습니다.'}
        </div>
      )}
    </div>
  );
}
