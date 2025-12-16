'use client';

import { useEffect, useState } from 'react';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
  bgColor: string | null;
  textColor: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_BG_COLORS = [
  { value: 'bg-gradient-to-r from-blue-600 to-blue-800', label: '파랑 그라데이션' },
  { value: 'bg-gradient-to-r from-purple-600 to-purple-800', label: '보라 그라데이션' },
  { value: 'bg-gradient-to-r from-green-600 to-green-800', label: '초록 그라데이션' },
  { value: 'bg-gradient-to-r from-orange-500 to-red-600', label: '주황-빨강 그라데이션' },
  { value: 'bg-gradient-to-r from-pink-500 to-purple-600', label: '핑크-보라 그라데이션' },
  { value: 'bg-gray-900', label: '어두운 회색' },
];

const DEFAULT_TEXT_COLORS = [
  { value: 'text-white', label: '흰색' },
  { value: 'text-gray-900', label: '검정' },
  { value: 'text-gray-100', label: '밝은 회색' },
];

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    buttonText: '',
    buttonLink: '',
    imageUrl: '',
    bgColor: 'bg-gradient-to-r from-blue-600 to-blue-800',
    textColor: 'text-white',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/admin/banners');
      if (response.ok) {
        const data = await response.json();
        setBanners(data);
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/admin/banners/${editingId}`
        : '/api/admin/banners';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          subtitle: formData.subtitle || null,
          description: formData.description || null,
          buttonText: formData.buttonText || null,
          buttonLink: formData.buttonLink || null,
          imageUrl: formData.imageUrl || null,
        }),
      });

      if (response.ok) {
        await fetchBanners();
        resetForm();
        alert(editingId ? '배너가 수정되었습니다.' : '배너가 생성되었습니다.');
      } else {
        const error = await response.json();
        alert(error.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to save banner:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      buttonText: banner.buttonText || '',
      buttonLink: banner.buttonLink || '',
      imageUrl: banner.imageUrl || '',
      bgColor: banner.bgColor || 'bg-gradient-to-r from-blue-600 to-blue-800',
      textColor: banner.textColor || 'text-white',
      order: banner.order,
      isActive: banner.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 배너를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBanners();
        alert('배너가 삭제되었습니다.');
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      buttonText: '',
      buttonLink: '',
      imageUrl: '',
      bgColor: 'bg-gradient-to-r from-blue-600 to-blue-800',
      textColor: 'text-white',
      order: 0,
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">배너 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            메인페이지에 표시될 로테이션 배너를 관리합니다. (최대 3개 권장)
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showForm ? '취소' : '새 배너'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? '배너 수정' : '새 배너 작성'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                제목 *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: AI 기반 법인 컨설팅 비서"
              />
            </div>

            <div>
              <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700">
                부제목
              </label>
              <input
                type="text"
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 새로운 기능 출시!"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                설명
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 기업정보를 업로드하면 AI 분석 리포트를 생성합니다."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700">
                  버튼 텍스트
                </label>
                <input
                  type="text"
                  id="buttonText"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 지금 시작하기"
                />
              </div>

              <div>
                <label htmlFor="buttonLink" className="block text-sm font-medium text-gray-700">
                  버튼 링크
                </label>
                <input
                  type="text"
                  id="buttonLink"
                  value={formData.buttonLink}
                  onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: /auth/register"
                />
              </div>
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                배경 이미지 URL (선택사항)
              </label>
              <input
                type="text"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: https://example.com/banner.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">배경 이미지를 설정하면 배경색 대신 이미지가 표시됩니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="bgColor" className="block text-sm font-medium text-gray-700">
                  배경색
                </label>
                <select
                  id="bgColor"
                  value={formData.bgColor}
                  onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {DEFAULT_BG_COLORS.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="textColor" className="block text-sm font-medium text-gray-700">
                  텍스트 색상
                </label>
                <select
                  id="textColor"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {DEFAULT_TEXT_COLORS.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                  순서
                </label>
                <input
                  type="number"
                  id="order"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">낮을수록 먼저 표시됩니다.</p>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                활성화 (체크 시 메인페이지에 표시됩니다)
              </label>
            </div>

            {/* Preview */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">미리보기</h3>
              <div
                className={`relative min-h-[200px] ${formData.bgColor} rounded-lg overflow-hidden`}
                style={formData.imageUrl ? {
                  backgroundImage: `url(${formData.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : undefined}
              >
                {formData.imageUrl && (
                  <div className="absolute inset-0 bg-black/40" />
                )}
                <div className={`relative p-8 ${formData.textColor}`}>
                  {formData.subtitle && (
                    <p className="text-sm mb-2 opacity-90">{formData.subtitle}</p>
                  )}
                  <h4 className="text-2xl font-bold mb-2">{formData.title || '제목을 입력하세요'}</h4>
                  {formData.description && (
                    <p className="text-sm opacity-90 mb-4">{formData.description}</p>
                  )}
                  {formData.buttonText && (
                    <button className="px-4 py-2 bg-white text-gray-900 rounded-md text-sm font-medium">
                      {formData.buttonText}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingId ? '수정' : '생성'}
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

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {banners.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            등록된 배너가 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {banners.map((banner) => (
              <li key={banner.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                        순서: {banner.order}
                      </span>
                      {banner.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                          활성
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                          비활성
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-sm text-gray-600 mb-1">{banner.subtitle}</p>
                    )}
                    {banner.description && (
                      <p className="text-sm text-gray-500 mb-2">
                        {banner.description.length > 100
                          ? banner.description.slice(0, 100) + '...'
                          : banner.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      {banner.buttonText && (
                        <span>버튼: {banner.buttonText}</span>
                      )}
                      {banner.buttonLink && (
                        <span>링크: {banner.buttonLink}</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      수정일: {new Date(banner.updatedAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
