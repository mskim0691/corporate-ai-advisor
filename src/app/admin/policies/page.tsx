'use client';

import { useEffect, useState } from 'react';

interface GroupPolicy {
  id: string;
  groupName: string;
  monthlyProjectLimit: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/* 크레딧 기능 비활성화
interface InitialCreditPolicy {
  credits: number;
  description: string | null;
}
*/

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<GroupPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: number }>({});

  /* 크레딧 기능 비활성화
  // Initial credit states
  const [initialCreditPolicy, setInitialCreditPolicy] = useState<InitialCreditPolicy>({ credits: 0, description: null });
  const [initialCredits, setInitialCredits] = useState("0");
  const [initialCreditDescription, setInitialCreditDescription] = useState("");
  const [savingInitialCredit, setSavingInitialCredit] = useState(false);
  */

  useEffect(() => {
    fetchPolicies();
    // fetchInitialCreditPolicy(); // 크레딧 기능 비활성화
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/admin/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
        // Initialize edit values
        const initialValues: { [key: string]: number } = {};
        data.forEach((policy: GroupPolicy) => {
          initialValues[policy.groupName] = policy.monthlyProjectLimit;
        });
        setEditValues(initialValues);
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
    }
  };

  /* 크레딧 기능 비활성화
  const fetchInitialCreditPolicy = async () => {
    try {
      const response = await fetch("/api/admin/initial-credit");
      const data = await response.json();

      if (data.policy) {
        setInitialCreditPolicy(data.policy);
        setInitialCredits(data.policy.credits.toString());
        setInitialCreditDescription(data.policy.description || "");
      }
    } catch (error) {
      console.error("Failed to fetch initial credit policy:", error);
    }
  };
  */

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
          monthlyProjectLimit: editValues[groupName],
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

  const handleChange = (groupName: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditValues((prev) => ({
      ...prev,
      [groupName]: numValue,
    }));
  };

  /* 크레딧 기능 비활성화
  const handleSaveInitialCredit = async () => {
    const creditValue = parseInt(initialCredits);

    if (isNaN(creditValue) || creditValue < 0) {
      alert("유효한 크레딧 값을 입력해주세요");
      return;
    }

    setSavingInitialCredit(true);

    try {
      const response = await fetch("/api/admin/initial-credit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credits: creditValue,
          description: initialCreditDescription.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "저장에 실패했습니다");
      }

      alert("초기 크레딧 정책이 업데이트되었습니다");
      await fetchInitialCreditPolicy();
    } catch (error) {
      alert(error instanceof Error ? error.message : "저장 중 오류가 발생했습니다");
    } finally {
      setSavingInitialCredit(false);
    }
  };
  */

  const getGroupDescription = (groupName: string) => {
    switch (groupName) {
      case 'admin':
        return '관리자 그룹 - 무제한 프로젝트 생성';
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
      case 'pro':
        return 'Pro';
      case 'free':
        return 'Free';
      default:
        return groupName;
    }
  };

  const ensureAllGroups = () => {
    const groups = ['admin', 'pro', 'free'];
    const existingGroups = policies.map((p) => p.groupName);
    const allPolicies = [...policies];

    groups.forEach((group) => {
      if (!existingGroups.includes(group)) {
        allPolicies.push({
          id: '',
          groupName: group,
          monthlyProjectLimit: group === 'admin' ? 999999 : group === 'pro' ? 10 : 3,
          description: getGroupDescription(group),
          createdAt: '',
          updatedAt: '',
        });
      }
    });

    return allPolicies.sort((a, b) => {
      const order = { admin: 0, pro: 1, free: 2 };
      return (
        order[a.groupName as keyof typeof order] -
        order[b.groupName as keyof typeof order]
      );
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
          사용자 그룹별 월간 프로젝트 생성 제한을 설정합니다.
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {getGroupDisplayName(policy.groupName)} 그룹
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {policy.description || getGroupDescription(policy.groupName)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label
                        htmlFor={`limit-${policy.groupName}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        월간 프로젝트 제한:
                      </label>
                      <input
                        id={`limit-${policy.groupName}`}
                        type="number"
                        min="0"
                        value={editValues[policy.groupName] ?? policy.monthlyProjectLimit}
                        onChange={(e) => handleChange(policy.groupName, e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <span className="text-sm text-gray-600">개</span>
                    </div>
                    <button
                      onClick={() => handleSave(policy.groupName)}
                      disabled={
                        saving === policy.groupName ||
                        editValues[policy.groupName] === policy.monthlyProjectLimit
                      }
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        saving === policy.groupName ||
                        editValues[policy.groupName] === policy.monthlyProjectLimit
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }`}
                    >
                      {saving === policy.groupName ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
                <div className="mt-4 bg-gray-50 rounded-md p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">현재 설정:</span> 월{' '}
                    {policy.monthlyProjectLimit === 999999
                      ? '무제한'
                      : `${policy.monthlyProjectLimit}개`}{' '}
                    프로젝트 생성 가능
                  </p>
                  {policy.updatedAt && (
                    <p className="text-xs text-gray-500 mt-1">
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
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 크레딧 기능 비활성화
      {/* Initial Credit Policy Section *}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">신규 회원 초기 크레딧 설정</h2>
            <p className="mt-2 text-sm text-gray-600">
              새로운 회원가입 시 지급할 초기 크레딧을 설정합니다
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-semibold">현재 설정된 초기 크레딧</span>
              <span className="text-3xl font-bold text-blue-600">{initialCreditPolicy.credits}</span>
            </div>
            {initialCreditPolicy.description && (
              <p className="mt-2 text-sm text-gray-600">{initialCreditPolicy.description}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="initial-credits" className="block text-sm font-medium text-gray-700">
                초기 크레딧 수량
              </label>
              <input
                id="initial-credits"
                type="number"
                min="0"
                value={initialCredits}
                onChange={(e) => setInitialCredits(e.target.value)}
                placeholder="예: 1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="text-sm text-gray-500">
                새로 가입하는 회원에게 지급할 크레딧 수량을 입력하세요
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="initial-credit-description" className="block text-sm font-medium text-gray-700">
                설명 (선택사항)
              </label>
              <textarea
                id="initial-credit-description"
                value={initialCreditDescription}
                onChange={(e) => setInitialCreditDescription(e.target.value)}
                placeholder="예: 신규 회원 웰컴 크레딧"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveInitialCredit}
                disabled={savingInitialCredit}
                className={`w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  savingInitialCredit
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {savingInitialCredit ? "저장 중..." : "정책 저장"}
              </button>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">💡</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">참고사항</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>변경된 정책은 새로 가입하는 회원부터 적용됩니다</li>
                    <li>기존 회원의 크레딧에는 영향을 주지 않습니다</li>
                    <li>초기 크레딧은 회원가입 시 자동으로 지급됩니다</li>
                    <li>0으로 설정하면 초기 크레딧을 지급하지 않습니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}
