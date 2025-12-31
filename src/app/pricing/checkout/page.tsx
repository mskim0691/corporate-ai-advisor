'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

declare global {
  interface Window {
    TossPayments: any;
  }
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const paymentWidgetRef = useRef<any>(null);
  const paymentMethodWidgetRef = useRef<any>(null);

  const planName = searchParams.get('plan');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (!planName || !amount) {
      setError('잘못된 접근입니다');
      setLoading(false);
      return;
    }

    // 결제 정보 준비
    preparePayment();
  }, [planName, amount]);

  useEffect(() => {
    if (!paymentData) return;

    // 토스페이먼츠 SDK 로드
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment-widget';
    script.async = true;
    script.onload = () => initializePaymentWidget();
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [paymentData]);

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
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const initializePaymentWidget = () => {
    if (!paymentData?.clientKey || !window.TossPayments) return;

    const tossPayments = window.TossPayments(paymentData.clientKey);
    const paymentWidget = tossPayments.paymentWidget({
      customerKey: paymentData.orderId,
    });

    paymentWidgetRef.current = paymentWidget;

    // 결제 위젯 렌더링
    paymentWidget.renderPaymentMethods({
      selector: '#payment-method',
      variantKey: 'DEFAULT',
    }).then((paymentMethodWidget: any) => {
      paymentMethodWidgetRef.current = paymentMethodWidget;
    });

    // 이용약관 위젯 렌더링
    paymentWidget.renderAgreement({
      selector: '#agreement',
      variantKey: 'AGREEMENT',
    });
  };

  const handlePayment = async () => {
    if (!paymentWidgetRef.current || !paymentData) return;

    try {
      await paymentWidgetRef.current.requestPayment({
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
      });
    } catch (err: any) {
      if (err.code === 'USER_CANCEL') {
        // 사용자가 취소한 경우
        return;
      }
      setError(err.message || '결제 중 오류가 발생했습니다');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">결제 준비 중...</p>
        </div>
      </div>
    );
  }

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
                <span className="font-semibold">{paymentData?.orderName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">결제 금액</span>
                <span className="text-xl font-bold text-blue-600">
                  ₩{parseInt(amount || '0').toLocaleString()}
                </span>
              </div>
            </div>

            {/* 토스페이먼츠 결제 위젯 */}
            <div id="payment-method" className="min-h-[300px]"></div>

            {/* 이용약관 위젯 */}
            <div id="agreement"></div>

            <div className="flex gap-4">
              <Link href="/pricing" className="flex-1">
                <Button variant="outline" className="w-full">취소</Button>
              </Link>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handlePayment}
              >
                결제하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
