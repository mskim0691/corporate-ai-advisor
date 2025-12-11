'use client';

import { useEffect, useState } from 'react';

interface CreditPrice {
  id: string;
  type: string;
  name: string;
  credits: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CreditPricesPage() {
  const [prices, setPrices] = useState<CreditPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/admin/credit-prices');
      if (response.ok) {
        const data = await response.json();
        setPrices(data);
        const initial: { [key: string]: number } = {};
        data.forEach((p: CreditPrice) => {
          initial[p.type] = p.credits;
        });
        setEditing(initial);
      }
    } catch (error) {
      console.error('Failed to fetch credit prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (type: string, name: string) => {
    try {
      const response = await fetch('/api/admin/credit-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name,
          credits: editing[type],
          isActive: true,
        }),
      });

      if (response.ok) {
        await fetchPrices();
        alert('저장되었습니다.');
      } else {
        alert('저장 실패');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('오류 발생');
    }
  };

  const defaultPrices = [
    { type: 'basic_analysis', name: '기본 분석', credits: 10 },
    { type: 'premium_presentation', name: '고급 프레젠테이션', credits: 50 },
  ];

  const allPrices = defaultPrices.map((def) => {
    const existing = prices.find((p) => p.type === def.type);
    return existing || { ...def, id: '', isActive: true, description: null, createdAt: '', updatedAt: '' };
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="text-gray-500">로딩 중...</div></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">크레딧 가격 설정</h1>
        <p className="mt-2 text-sm text-gray-600">서비스별 크레딧 소진 가격을 설정합니다.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {allPrices.map((price) => (
          <div key={price.type} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{price.name}</h3>
                <p className="text-sm text-gray-500">타입: {price.type}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">크레딧:</label>
                  <input
                    type="number"
                    min="0"
                    value={editing[price.type] ?? price.credits}
                    onChange={(e) => setEditing({ ...editing, [price.type]: parseInt(e.target.value) || 0 })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  onClick={() => handleSave(price.type, price.name)}
                  disabled={editing[price.type] === price.credits}
                  className={`px-4 py-2 rounded-md text-white ${
                    editing[price.type] === price.credits
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  저장
                </button>
              </div>
            </div>
            {price.id && (
              <p className="text-xs text-gray-500 mt-2">
                마지막 수정: {new Date(price.updatedAt).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">알림</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>기본 분석: 프로젝트 생성 시 자동으로 차감</li>
                <li>고급 프레젠테이션: 사용자가 요청 시 차감</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
