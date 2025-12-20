'use client';

import { useEffect, useState } from 'react';

interface GroupPolicy {
  id: string;
  groupName: string;
  monthlyProjectLimit: number;
  monthlyPresentationLimit: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<GroupPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: { project: number; presentation: number } }>({});

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/admin/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
        // Initialize edit values
        const initialValues: { [key: string]: { project: number; presentation: number } } = {};
        data.forEach((policy: GroupPolicy) => {
          initialValues[policy.groupName] = {
            project: policy.monthlyProjectLimit,
            presentation: policy.monthlyPresentationLimit || 0,
          };
        });
        setEditValues(initialValues);
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (groupName: string) => {
    setSaving(groupName);
    try {
      const response = await fetch('/api/admin/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName,
          monthlyProjectLimit: editValues[groupName].project,
          monthlyPresentationLimit: editValues[groupName].presentation,
          description: getGroupDescription(groupName),
        }),
      });

      if (response.ok) {
        await fetchPolicies();
        alert('정책이 성공적으로 저장되었습니다.');
      } else {
        const error = await response.json();
        alert(error.error || '정책 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save policy:', error);
      alert('정책 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(null);
    }
  };

  const handleChange = (groupName: string, type: 'project' | 'presentation', value: string) => {
    const numValue = parseInt(value) || 0;
    setEditValues((prev) => ({
      ...prev,
      [groupName]: {
        ...prev[groupName],
        [type]: numValue,
      },
    }));
  };

  const getGroupDescription = (groupName: string) => {
    switch (groupName) {
      case 'admin':
        return '관리자 그룹 - 무제한 솔루션 및 비주얼 레포트 생성';
      case 'expert':
        return 'Expert 그룹 - 전문가/기업 사용자';
      case 'pro':
        return 'Pro 그룹 - 유료 구독 사용자';
      case 'free':
        return 'Free 그룹 - 무료 사용자';
      default:
        return null;
    }
  };

  const getGroupDisplayName = (groupName: string) => {
    switch (groupName) {
      case 'admin':
        return '관리자';
      case 'expert':
        return 'Expert';
      case 'pro':
        return 'Pro';
      case 'free':
        return 'Free';
      default:
        return groupName;
    }
  };

  const ensureAllGroups = () => {
    const groups = ['admin', 'expert', 'pro', 'free'];
    const existingGroups = policies.map((p) => p.groupName);
    const allPolicies = [...policies];

    const defaultLimits: { [key: string]: { project: number; presentation: number } } = {
      admin: { project: 999999, presentation: 999999 },
      expert: { project: 30, presentation: 10 },
      pro: { project: 15, presentation: 1 },
      free: { project: 3, presentation: 0 },
    };

    groups.forEach((group) => {
      if (!existingGroups.includes(group)) {
        allPolicies.push({
          id: '',
          groupName: group,
          monthlyProjectLimit: defaultLimits[group].project,
          monthlyPresentationLimit: defaultLimits[group].presentation,
          description: getGroupDescription(group),
          createdAt: '',
          updatedAt: '',
        });
      }
    });

    return allPolicies.sort((a, b) => {
      const order: { [key: string]: number } = { admin: 0, expert: 1, pro: 2, free: 3 };
      return (order[a.groupName] ?? 99) - (order[b.groupName] ?? 99);
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const allPolicies = ensureAllGroups();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">그룹 정책 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          사용자 그룹별 월간 분석솔루션 및 비주얼 레포트 생성 제한을 설정합니다.
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {allPolicies.map((policy) => (
              <div
                key={policy.groupName}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {getGroupDisplayName(policy.groupName)} 그룹
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {policy.description || getGroupDescription(policy.groupName)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor={`solution-${policy.groupName}`}
                      className="text-sm font-medium text-gray-700 min-w-[140px]"
                    >
                      월간 분석솔루션 제한:
                    </label>
                    <input
                      id={`solution-${policy.groupName}`}
                      type="number"
                      min="0"
                      value={editValues[policy.groupName]?.project ?? policy.monthlyProjectLimit}
                      onChange={(e) => handleChange(policy.groupName, 'project', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <span className="text-sm text-gray-600">개</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor={`presentation-${policy.groupName}`}
                      className="text-sm font-medium text-gray-700 min-w-[140px]"
                    >
                      월간 비주얼 레포트 제한:
                    </label>
                    <input
                      id={`presentation-${policy.groupName}`}
                      type="number"
                      min="0"
                      value={editValues[policy.groupName]?.presentation ?? policy.monthlyPresentationLimit}
                      onChange={(e) => handleChange(policy.groupName, 'presentation', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <span className="text-sm text-gray-600">개</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave(policy.groupName)}
                    disabled={
                      saving === policy.groupName ||
                      (editValues[policy.groupName]?.project === policy.monthlyProjectLimit &&
                        editValues[policy.groupName]?.presentation === policy.monthlyPresentationLimit)
                    }
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      saving === policy.groupName ||
                      (editValues[policy.groupName]?.project === policy.monthlyProjectLimit &&
                        editValues[policy.groupName]?.presentation === policy.monthlyPresentationLimit)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    {saving === policy.groupName ? '저장 중...' : '저장'}
                  </button>
                </div>

                <div className="mt-4 bg-gray-50 rounded-md p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">현재 설정:</span>
                  </p>
                  <ul className="mt-2 text-sm text-gray-700 space-y-1">
                    <li>
                      • 분석솔루션: 월{' '}
                      {policy.monthlyProjectLimit === 999999
                        ? '무제한'
                        : `${policy.monthlyProjectLimit}개`}{' '}
                      생성 가능
                    </li>
                    <li>
                      • 비주얼 레포트: 월{' '}
                      {policy.monthlyPresentationLimit === 999999
                        ? '무제한'
                        : `${policy.monthlyPresentationLimit}개`}{' '}
                      생성 가능
                    </li>
                  </ul>
                  {policy.updatedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      마지막 수정: {new Date(policy.updatedAt).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">알림</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      사용자의 구독 플랜(free/pro)과 역할(admin)에 따라 정책이 적용됩니다.
                    </li>
                    <li>
                      관리자 역할의 사용자는 구독 플랜과 관계없이 admin 정책이 적용됩니다.
                    </li>
                    <li>월간 제한은 매달 1일에 초기화됩니다.</li>
                    <li>분석솔루션: 기업 분석 프로젝트 생성 횟수를 제한합니다.</li>
                    <li>비주얼 레포트: 고급 프레젠테이션 제작 횟수를 제한합니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
