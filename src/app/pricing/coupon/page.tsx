'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CouponPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Format code as user types (XXXX-XXXX-XXXX-XXXX)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Add dashes every 4 characters
    if (value.length > 16) {
      value = value.substring(0, 16);
    }

    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.substring(i, i + 4));
    }

    setCode(parts.join('-'));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.replace(/-/g, '').length !== 16) {
      setError('올바른 쿠폰 코드를 입력해주세요 (16자리)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        router.push('/dashboard');
      } else {
        if (data.error?.includes('이미 사용된')) {
          alert(data.error);
          router.back();
        } else if (response.status === 401) {
          alert('로그인이 필요합니다');
          router.push('/auth/login?redirect=/pricing/coupon');
        } else {
          setError(data.error || '쿠폰 등록에 실패했습니다');
        }
      }
    } catch (err) {
      console.error('Coupon redemption error:', err);
      setError('쿠폰 등록 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">
              AI-GFC
            </h1>
          </Link>
          <Link href="/pricing">
            <Button variant="outline">요금제 보기</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">이용권 등록</CardTitle>
              <CardDescription>
                발급받은 이용권 쿠폰 코드를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">쿠폰 코드</label>
                  <Input
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="font-mono text-center text-lg tracking-wider"
                    maxLength={19}
                    autoFocus
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm font-medium mb-2">안내사항</p>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• 쿠폰 코드는 1회만 사용 가능합니다</li>
                    <li>• Pro 플랜 이용권이 적용됩니다</li>
                    <li>• 등록 시점부터 30일간 유효합니다</li>
                    <li>• 기존 구독이 있는 경우 쿠폰 기간이 적용됩니다</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || code.replace(/-/g, '').length !== 16}
                >
                  {loading ? '등록 중...' : '이용권 등록'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/pricing"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← 요금제 페이지로 돌아가기
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
