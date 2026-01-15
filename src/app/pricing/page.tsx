'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Footer } from '@/components/footer';

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  monthlyAnalysis: number;
  monthlyPresentation: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
  badgeText: string | null;
  badgeColor: string | null;
  buttonText: string;
  buttonVariant: string;
}

interface UserSubscription {
  plan: string;
  status: string;
}

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [downgrading, setDowngrading] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchUserSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/pricing-plans');
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

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      if (response.ok) {
        const data: UserSubscription = await response.json();
        setCurrentPlan(data.plan || 'free');
        setIsLoggedIn(true);
      } else if (response.status === 401) {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!isLoggedIn) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    if (plan.name === currentPlan) {
      return;
    }

    // 다운그레이드 (Free 플랜으로)
    if (plan.name === 'free' && currentPlan !== 'free') {
      setShowDowngradeDialog(true);
      return;
    }

    // 업그레이드는 결제 페이지로
    if (plan.name !== 'free') {
      router.push(`/pricing/checkout?plan=${plan.name}&amount=${plan.price}`);
    }
  };

  const handleDowngrade = async () => {
    setDowngrading(true);
    try {
      const response = await fetch('/api/user/subscription/downgrade', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Free 플랜으로 변경되었습니다.');
        setCurrentPlan('free');
        setShowDowngradeDialog(false);
      } else {
        const error = await response.json();
        alert(error.error || '다운그레이드 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      alert('다운그레이드 중 오류가 발생했습니다.');
    } finally {
      setDowngrading(false);
    }
  };

  const getPlanOrder = (planName: string) => {
    const order: Record<string, number> = { free: 0, pro: 1, expert: 2 };
    return order[planName] ?? 0;
  };

  const isUpgrade = (planName: string) => {
    return getPlanOrder(planName) > getPlanOrder(currentPlan);
  };

  const isDowngrade = (planName: string) => {
    return getPlanOrder(planName) < getPlanOrder(currentPlan);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">AI-GFC</h1>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16">
          <div className="text-center text-gray-500">로딩 중...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">AI-GFC</h1>
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button variant="outline">대시보드</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">로그인</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>회원가입</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">구독 플랜 선택</h2>
          <p className="text-xl text-gray-600">
            비즈니스에 맞는 플랜을 선택하세요
          </p>
          {isLoggedIn && (
            <p className="mt-4 text-blue-600 font-medium">
              현재 플랜: {currentPlan === 'expert' ? 'Expert' : currentPlan === 'pro' ? 'Pro' : 'Free'}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === currentPlan;
            const isHighlighted = plan.isPopular || plan.badgeText;
            const badgeColorClass =
              plan.badgeColor === 'blue'
                ? 'bg-blue-500'
                : plan.badgeColor === 'green'
                ? 'bg-green-500'
                : plan.badgeColor === 'orange'
                ? 'bg-orange-500'
                : 'bg-red-500';

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  isHighlighted ? 'border-blue-600 border-2 shadow-lg' : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.badgeText && (
                  <div
                    className={`absolute top-0 right-0 ${badgeColorClass} text-white px-4 py-1 text-sm font-bold rounded-bl-lg rounded-tr-lg`}
                  >
                    {plan.badgeText}
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 text-sm font-bold rounded-br-lg rounded-tl-lg">
                    현재 플랜
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                  <CardDescription>
                    {plan.name === 'free' && '기본 기능 체험'}
                    {plan.name === 'pro' && '성장하는 비즈니스를 위한'}
                    {plan.name === 'expert' && '전문가를 위한 최고의 선택'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    {plan.originalPrice ? (
                      <>
                        <p className="text-gray-500 line-through text-lg">
                          ₩{plan.originalPrice.toLocaleString()}/월
                        </p>
                        <p className={`text-4xl font-bold ${isHighlighted ? 'text-blue-600' : ''}`}>
                          ₩{plan.price.toLocaleString()}
                          <span className="text-base font-normal text-gray-700">/월</span>
                        </p>
                      </>
                    ) : (
                      <p className="text-4xl font-bold">
                        {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
                        {plan.price > 0 && <span className="text-base font-normal">/월</span>}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-600">월간 분석 솔루션</span>
                      <span className="font-semibold">
                        {plan.monthlyAnalysis === 999999 ? '무제한' : `${plan.monthlyAnalysis}회`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-600">월간 비주얼 레포트</span>
                      <span className="font-semibold">
                        {plan.monthlyPresentation === 999999
                          ? '무제한'
                          : plan.monthlyPresentation === 0
                          ? '-'
                          : `${plan.monthlyPresentation}회`}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-600 mr-2 mt-0.5">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${isHighlighted ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.buttonVariant === 'outline' ? 'outline' : 'default'}
                    disabled={isCurrentPlan}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isCurrentPlan ? (
                      '현재 사용 중'
                    ) : isUpgrade(plan.name) ? (
                      '업그레이드'
                    ) : isDowngrade(plan.name) ? (
                      '다운그레이드'
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">자주 묻는 질문</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">결제는 어떻게 진행되나요?</h4>
                <p className="text-gray-600">
                  토스페이먼츠를 통해 안전하게 결제됩니다. 신용카드, 체크카드, 계좌이체 등 다양한 결제 수단을 지원합니다.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">플랜 변경은 어떻게 하나요?</h4>
                <p className="text-gray-600">
                  언제든지 상위 플랜으로 업그레이드하거나 하위 플랜으로 다운그레이드할 수 있습니다. 변경 사항은 다음 결제 주기부터 적용됩니다.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">구독 해지 및 환불은 어떻게 하나요?</h4>
                <div className="text-gray-600 space-y-3">
                  <p>
                    <strong>구독 해지:</strong> 언제든지 다음 달 구독을 해지(정기결제 중단)할 수 있습니다. 해지 신청 시, 다음 결제일부터 요금이 청구되지 않으며, 현재 이용 중인 유료 회차의 만료일까지는 서비스 이용 권한이 유지됩니다.
                  </p>
                  <div>
                    <p className="mb-2"><strong>환불 규정:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>전액 환불:</strong> 결제일로부터 7일 이내에 서비스 이용 이력(기업 분석 조회, 제안서 생성 및 다운로드 등)이 전혀 없는 경우에 한하여 전액 환불이 가능합니다.</li>
                      <li><strong>환불 불가:</strong> 다음의 경우 해당 월 이용 요금은 환불되지 않습니다.
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>결제 후 7일이 경과한 경우</li>
                          <li>결제 후 서비스를 1회라도 이용한 경우 (단순 조회 포함)</li>
                          <li>2단계 비주얼레포트 (PDF 등) 생성을 실행한 경우 (디지털 콘텐츠의 가치가 제공된 것으로 간주)</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* 다운그레이드 확인 모달 */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Free 플랜으로 다운그레이드</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                현재 <strong>{currentPlan === 'expert' ? 'Expert' : 'Pro'}</strong> 플랜에서{' '}
                <strong>Free</strong> 플랜으로 변경하시겠습니까?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <p className="text-yellow-800 text-sm font-medium">주의사항:</p>
                <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                  <li>• 정기결제가 즉시 해지됩니다.</li>
                  <li>• Free 플랜의 기능만 사용 가능합니다.</li>
                  <li>• 이미 결제한 금액은 환불되지 않습니다.</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDowngradeDialog(false)}
              disabled={downgrading}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDowngrade}
              disabled={downgrading}
            >
              {downgrading ? '처리 중...' : '다운그레이드 확인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
