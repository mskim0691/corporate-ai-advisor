'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loadTossPayments, TossPaymentsPayment } from '@tosspayments/tosspayments-sdk';

interface BillingAuthData {
  clientKey: string;
  customerKey: string;
  customerEmail: string;
  customerName: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingAuthData, setBillingAuthData] = useState<BillingAuthData | null>(null);
  const [payment, setPayment] = useState<TossPaymentsPayment | null>(null);

  const planName = searchParams.get('plan');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (!planName || !amount) {
      setError('잘못된 접근입니다');
      setLoading(false);
      return;
    }

    initializeBillingAuth();
  }, [planName, amount]);

  const initializeBillingAuth = async () => {
    try {
      // 클라이언트 키와 고객 키 가져오기
      const response = await fetch('/api/payments/toss/billing/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName, amount: parseInt(amount || '0') }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '빌링 인증 준비 실패');
      }

      const data = await response.json();
      setBillingAuthData(data);

      // TossPayments SDK 초기화
      const tossPayments = await loadTossPayments(data.clientKey);
      const paymentInstance = tossPayments.payment({
        customerKey: data.customerKey,
      });

      setPayment(paymentInstance);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleBillingAuth = async () => {
    if (!payment || !billingAuthData || !planName || !amount) return;

    try {
      setLoading(true);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      // 빌링키 발급을 위한 카드 인증 요청
      await payment.requestBillingAuth({
        method: 'CARD',
        successUrl: `${baseUrl}/api/payments/toss/billing/success?planName=${planName}&amount=${amount}`,
        failUrl: `${baseUrl}/pricing?error=billing_auth_failed`,
        customerEmail: billingAuthData.customerEmail,
        customerName: billingAuthData.customerName,
      });
    } catch (err: any) {
      if (err.code === 'USER_CANCEL') {
        setLoading(false);
        return;
      }
      setError(err.message || '빌링 인증 중 오류가 발생했습니다');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">오류 발생</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/pricing">
              <Button variant="outline" className="w-full">요금제 페이지로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <h1 className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">AI-GFC</h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>정기결제 등록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💳 빌링 결제 안내</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 카드 정보를 안전하게 등록하여 매월 자동으로 결제됩니다</li>
                <li>• 첫 결제는 즉시 진행되며, 이후 매월 자동 갱신됩니다</li>
                <li>• 언제든지 구독을 해지할 수 있습니다</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">상품명</span>
                <span className="font-semibold">
                  AI-GFC {planName?.toUpperCase()} 플랜 월간 구독
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">월 결제 금액</span>
                <span className="text-xl font-bold text-blue-600">
                  ₩{parseInt(amount || '0').toLocaleString()}
                </span>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">로딩 중...</p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Link href="/pricing" className="flex-1">
                <Button variant="outline" className="w-full" disabled={loading}>
                  취소
                </Button>
              </Link>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleBillingAuth}
                disabled={loading || !payment}
              >
                {loading ? '처리 중...' : '카드 등록 및 구독하기'}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              결제 진행 시 서비스 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
