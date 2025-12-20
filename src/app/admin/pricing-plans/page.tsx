'use client';

import { useEffect, useState } from 'react';

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  monthlyAnalysis: number;
  monthlyPresentation: number;
  features: string;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
  badgeText: string | null;
  badgeColor: string | null;
  buttonText: string;
  buttonVariant: string;
  createdAt: string;
  updatedAt: string;
}

export default function PricingPlansPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    price: 0,
    originalPrice: '',
    currency: 'KRW',
    monthlyAnalysis: 0,
    monthlyPresentation: 0,
    features: '',
    isPopular: false,
    isActive: true,
    displayOrder: 0,
    badgeText: '',
    badgeColor: '',
    buttonText: '시작하기',
    buttonVariant: 'default',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/pricing-plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Parse features from text to array
      const featuresArray = formData.features
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f);

      const url = editingId
        ? `/api/admin/pricing-plans/${editingId}`
        : '/api/admin/pricing-plans';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          badgeText: formData.badgeText || null,
          badgeColor: formData.badgeColor || null,
          features: featuresArray,
          monthlyPresentation: formData.monthlyPresentation,
        }),
      });

      if (response.ok) {
        await fetchPlans();
        resetForm();
        alert(editingId ? '가격 플랜이 수정되었습니다.' : '가격 플랜이 생성되었습니다.');
      } else {
        const error = await response.json();
        alert(error.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to save pricing plan:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleEdit = (plan: PricingPlan) => {
    setEditingId(plan.id);

    // Parse features JSON to text
    let featuresText = '';
    try {
      const featuresArray = JSON.parse(plan.features);
      featuresText = featuresArray.join('\n');
    } catch {
      featuresText = plan.features;
    }

    setFormData({
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price,
      originalPrice: plan.originalPrice?.toString() || '',
      currency: plan.currency,
      monthlyAnalysis: plan.monthlyAnalysis,
      monthlyPresentation: plan.monthlyPresentation || 0,
      features: featuresText,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
      badgeText: plan.badgeText || '',
      badgeColor: plan.badgeColor || '',
      buttonText: plan.buttonText,
      buttonVariant: plan.buttonVariant,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 가격 플랜을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/pricing-plans/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPlans();
        alert('가격 플랜이 삭제되었습니다.');
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete pricing plan:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      price: 0,
      originalPrice: '',
      currency: 'KRW',
      monthlyAnalysis: 0,
      monthlyPresentation: 0,
      features: '',
      isPopular: false,
      isActive: true,
      displayOrder: 0,
      badgeText: '',
      badgeColor: '',
      buttonText: '시작하기',
      buttonVariant: 'default',
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
          <h1 className="text-3xl font-bold text-gray-900">가격 플랜 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            메인 페이지에 표시될 가격 플랜을 관리합니다.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showForm ? '취소' : '새 플랜'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? '가격 플랜 수정' : '새 가격 플랜 작성'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  플랜 코드 * (예: free, standard)
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  표시 이름 * (예: Free, Standard)
                </label>
                <input
                  type="text"
                  id="displayName"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  가격 *
                </label>
                <input
                  type="number"
                  id="price"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700">
                  원래 가격 (할인 표시용)
                </label>
                <input
                  type="number"
                  id="originalPrice"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="monthlyAnalysis" className="block text-sm font-medium text-gray-700">
                  월간 분석솔루션 *
                </label>
                <input
                  type="number"
                  id="monthlyAnalysis"
                  required
                  value={formData.monthlyAnalysis}
                  onChange={(e) => setFormData({ ...formData, monthlyAnalysis: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="monthlyPresentation" className="block text-sm font-medium text-gray-700">
                  월간 비주얼레포트 *
                </label>
                <input
                  type="number"
                  id="monthlyPresentation"
                  required
                  value={formData.monthlyPresentation}
                  onChange={(e) => setFormData({ ...formData, monthlyPresentation: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700">
                  표시 순서
                </label>
                <input
                  type="number"
                  id="displayOrder"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="badgeText" className="block text-sm font-medium text-gray-700">
                  배지 텍스트 (예: 50% 할인 이벤트)
                </label>
                <input
                  type="text"
                  id="badgeText"
                  value={formData.badgeText}
                  onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="badgeColor" className="block text-sm font-medium text-gray-700">
                  배지 색상 (예: red, blue)
                </label>
                <input
                  type="text"
                  id="badgeColor"
                  value={formData.badgeColor}
                  onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

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
                />
              </div>

              <div>
                <label htmlFor="buttonVariant" className="block text-sm font-medium text-gray-700">
                  버튼 스타일 (default/outline)
                </label>
                <select
                  id="buttonVariant"
                  value={formData.buttonVariant}
                  onChange={(e) => setFormData({ ...formData, buttonVariant: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="default">기본</option>
                  <option value="outline">외곽선</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="features" className="block text-sm font-medium text-gray-700">
                기능 목록 * (한 줄에 하나씩)
              </label>
              <textarea
                id="features"
                required
                rows={6}
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="PDF 다운로드&#10;기본 지원&#10;월 4회 분석"
              />
            </div>

            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 block text-sm text-gray-900">인기 플랜으로 표시</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 block text-sm text-gray-900">활성화</span>
              </label>
            </div>

            <div className="flex space-x-3">
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
        {plans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            등록된 가격 플랜이 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {plans.map((plan) => {
              let featuresArray: string[] = [];
              try {
                featuresArray = JSON.parse(plan.features);
              } catch {
                featuresArray = [plan.features];
              }

              return (
                <li key={plan.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {plan.displayName}
                        </h3>
                        <span className="text-sm text-gray-500">({plan.name})</span>
                        {plan.isActive ? (
                          <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                            활성
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                            비활성
                          </span>
                        )}
                        {plan.isPopular && (
                          <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                            인기
                          </span>
                        )}
                        {plan.badgeText && (
                          <span className={`px-2 py-1 text-xs font-medium text-white bg-${plan.badgeColor || 'red'}-500 rounded-full`}>
                            {plan.badgeText}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <strong>가격:</strong> {plan.currency} {plan.price.toLocaleString()}
                          {plan.originalPrice && (
                            <span className="ml-2 line-through text-gray-400">
                              {plan.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>월간 분석솔루션:</strong> {plan.monthlyAnalysis}회
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>월간 비주얼레포트:</strong> {plan.monthlyPresentation}회
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>표시 순서:</strong> {plan.displayOrder}
                        </p>
                        <div className="text-sm text-gray-600">
                          <strong>기능:</strong>
                          <ul className="mt-1 ml-4 list-disc">
                            {featuresArray.map((feature, idx) => (
                              <li key={idx}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
