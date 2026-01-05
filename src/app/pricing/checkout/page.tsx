'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loadTossPayments, TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';

interface PaymentData {
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail: string;
  successUrl: string;
  failUrl: string;
  clientKey: string;
  customerKey: string;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [ready, setReady] = useState(false);

  const planName = searchParams.get('plan');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (!planName || !amount) {
      setError('잘못된 접근입니다');
      setLoading(false);
      return;
    }

    preparePayment();
  }, [planName, amount]);

  useEffect(() => {
    if (!paymentData?.clientKey) return;

    const initWidget = async () => {
      try {
        // v2 SDK 초기화
        const tossPayments = await loadTossPayments(paymentData.clientKey);

        // 결제 위젯 인스턴스 생성
        const widgetsInstance = tossPayments.widgets({
          customerKey: paymentData.customerKey,
        });

        setWidgets(widgetsInstance);

        // 금액 설정
        await widgetsInstance.setAmount({
          currency: 'KRW',
          value: parseInt(amount || '0'),
        });

        // 결제 수단 위젯 렌더링
        await widgetsInstance.renderPaymentMethods({
          selector: '#payment-method',
          variantKey: 'DEFAULT',
        });

        // 이용약관 위젯 렌더링
        await widgetsInstance.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        });

        setReady(true);
        setLoading(false);
      } catch (err: any) {
        console.error('Widget init error:', err);
        setError('결제 위젯 로딩에 실패했습니다: ' + (err.message || ''));
        setLoading(false);
      }
    };

    initWidget();
  }, [paymentData, amount]);

  const preparePayment = async () => {
    try {
      const response = await fetch('/api/payments/toss/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName,
          amount: parseInt(amount || '0'),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '결제 준비 실패');
      }

      const data = await response.json();
      setPaymentData(data);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!widgets || !paymentData || !ready) return;

    try {
      await widgets.requestPayment({
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
      });
    } catch (err: any) {
      if (err.code === 'USER_CANCEL') {
        return;
      }
      setError(err.message || '결제 중 오류가 발생했습니다');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">오류 발생</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <Link href="/pricing">
              <Button variant="outline">플랜 선택으로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <h1 className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">AI-GFC</h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>결제하기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">상품명</span>
                <span className="font-semibold">
                  AI-GFC {planName?.toUpperCase()} 플랜 월간 구독
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">결제 금액</span>
                <span className="text-xl font-bold text-blue-600">
                  ₩{parseInt(amount || '0').toLocaleString()}
                </span>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">결제 준비 중...</p>
                </div>
              </div>
            )}

            {/* 토스페이먼츠 결제 위젯 */}
            <div id="payment-method" className={loading ? 'hidden' : ''}></div>

            {/* 이용약관 위젯 */}
            <div id="agreement" className={loading ? 'hidden' : ''}></div>

            <div className="flex gap-4">
              <Link href="/pricing" className="flex-1">
                <Button variant="outline" className="w-full">취소</Button>
              </Link>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handlePayment}
                disabled={loading || !ready}
              >
                {loading ? '로딩 중...' : '결제하기'}
              </Button>
            </div>
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
