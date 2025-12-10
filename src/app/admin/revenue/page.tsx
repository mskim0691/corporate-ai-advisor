"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

interface RevenueStats {
  totalRevenue: number
  pendingRevenue: number
  refundedRevenue: number
  netRevenue: number
  totalTransactions: number
  pendingTransactions: number
  refundedTransactions: number
  averageTransaction: number
  monthlyRevenue?: { [key: string]: number }
  paymentMethodStats: {
    [key: string]: {
      count: number
      amount: number
    }
  }
}

interface RecentPayment {
  id: string
  userId: string
  amount: number
  currency: string
  paymentMethod: string | null
  status: string
  transactionId: string | null
  description: string | null
  paidAt: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
  }
}

interface RevenueData {
  stats: RevenueStats
  recentPayments: RecentPayment[]
  period: {
    type: string
    year: number
    month?: number
  }
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'all' | 'month' | 'year'>('all')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetchRevenue()
  }, [period, year, month])

  const fetchRevenue = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
        year: year.toString(),
        ...(period === 'month' && { month: month.toString() })
      })

      const response = await fetch(`/api/admin/revenue?${params}`)
      if (!response.ok) throw new Error('Failed to fetch revenue')
      const responseData = await response.json()
      setData(responseData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
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

  if (!data) return null

  const { stats, recentPayments } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">매출 통계</h1>
          <p className="mt-2 text-sm text-gray-600">
            결제 내역 및 매출 분석
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              period === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              period === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            연도별
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              period === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            월별
          </button>
        </div>

        {(period === 'year' || period === 'month') && (
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        )}

        {period === 'month' && (
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">총 매출</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ₩{stats.totalRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {stats.totalTransactions}건
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">순 매출</p>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            ₩{stats.netRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            환불 차감 후
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">대기 중</p>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">
            ₩{stats.pendingRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {stats.pendingTransactions}건
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">평균 거래액</p>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            ₩{Math.round(stats.averageTransaction).toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            완료 기준
          </p>
        </Card>
      </div>

      {/* Monthly Revenue Chart (Year view only) */}
      {period === 'year' && stats.monthlyRevenue && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">월별 매출 ({year}년)</h2>
          <div className="space-y-2">
            {Object.entries(stats.monthlyRevenue).map(([monthKey, amount]) => {
              const maxAmount = Math.max(...Object.values(stats.monthlyRevenue!))
              const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0

              return (
                <div key={monthKey} className="flex items-center space-x-4">
                  <div className="w-16 text-sm text-gray-600">{monthKey}</div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-32 text-right text-sm font-medium text-gray-900">
                    ₩{amount.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Payment Method Stats */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 수단별 통계</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  결제 수단
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  거래 건수
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  총 금액
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  평균 금액
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(stats.paymentMethodStats).map(([method, stat]) => (
                <tr key={method}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {method === 'unknown' ? '미지정' : method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {stat.count}건
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    ₩{stat.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    ₩{Math.round(stat.amount / stat.count).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Payments */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 결제 내역</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  결제 수단
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  설명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  결제일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/users/${payment.user.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {payment.user.name || payment.user.email}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₩{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.paymentMethod || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'refunded' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.status === 'completed' ? '완료' :
                       payment.status === 'pending' ? '대기' :
                       payment.status === 'refunded' ? '환불' : payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {payment.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleDateString()
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Additional Info */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">참고사항</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>환불된 금액: ₩{stats.refundedRevenue.toLocaleString()} ({stats.refundedTransactions}건)</li>
                <li>순 매출은 총 매출에서 환불 금액을 차감한 금액입니다</li>
                <li>대기 중인 결제는 아직 완료되지 않은 결제입니다</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
