"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface CreditTransaction {
  id: string
  amount: number
  type: string
  description: string | null
  balanceAfter: number
  createdAt: string
}

interface CreditHistoryData {
  currentBalance: number
  transactions: CreditTransaction[]
}

interface CreditPrice {
  type: string
  name: string
  credits: number
}

export default function CreditHistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CreditHistoryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prices, setPrices] = useState<{ basic: number; premium: number }>({ basic: 10, premium: 50 })

  useEffect(() => {
    fetchCreditHistory()
    fetchCreditPrices()
  }, [])

  const fetchCreditHistory = async () => {
    try {
      const response = await fetch('/api/user/credit-history')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch credit history')
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCreditPrices = async () => {
    try {
      const response = await fetch('/api/admin/credit-prices')
      if (response.ok) {
        const priceData: CreditPrice[] = await response.json()
        const basicPrice = priceData.find((p) => p.type === 'basic_analysis')
        const premiumPrice = priceData.find((p) => p.type === 'premium_presentation')

        setPrices({
          basic: basicPrice?.credits || 10,
          premium: premiumPrice?.credits || 50
        })
      }
    } catch (err) {
      console.error('Failed to fetch credit prices:', err)
      // Keep default values if fetch fails
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      'admin_grant': '관리자 충전',
      'admin_deduct': '관리자 차감',
      'analysis_cost': '기본 분석 사용',
      'presentation_cost': '고급 프레젠테이션 사용',
      'purchase': '크레딧 구매',
    }
    return typeLabels[type] || type
  }

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">오류 발생</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/dashboard")}>대시보드로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">크레딧 사용 내역</h1>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            대시보드
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Current Balance Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">현재 보유 크레딧</CardTitle>
            <CardDescription className="text-blue-100">
              사용 가능한 크레딧 잔액
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold">{data?.currentBalance || 0}</div>
            <p className="text-sm text-blue-100 mt-2">
              기본 분석: {prices.basic} 크레딧 · 고급 프레젠테이션: {prices.premium} 크레딧
            </p>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>거래 내역</CardTitle>
            <CardDescription>
              최근 100건의 크레딧 충전 및 사용 내역
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.transactions || data.transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>아직 거래 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-bold ${getTransactionColor(transaction.amount)}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {getTransactionTypeLabel(transaction.type)}
                          </div>
                          {transaction.description && (
                            <div className="text-sm text-gray-600">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        잔액: {transaction.balanceAfter}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">크레딧 안내</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 기본 분석 생성 시 {prices.basic} 크레딧이 차감됩니다</li>
                  <li>• 고급 프레젠테이션 제작 시 {prices.premium} 크레딧이 차감됩니다</li>
                  <li>• 관리자가 이벤트나 보상으로 크레딧을 충전할 수 있습니다</li>
                  <li>• 모든 거래 내역은 자동으로 기록됩니다</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
