'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

export function PricingSection() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
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

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">가격 플랜</h3>
          <div className="text-center text-gray-500">로딩 중...</div>
        </div>
      </section>
    );
  }

  if (plans.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-12">가격 플랜</h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
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
              <div
                key={plan.id}
                className={`p-8 border-2 rounded-lg bg-white relative ${
                  isHighlighted ? 'border-blue-600 bg-blue-50' : ''
                }`}
              >
                {plan.badgeText && (
                  <div
                    className={`absolute top-0 right-0 ${badgeColorClass} text-white px-4 py-1 text-sm font-bold rounded-bl-lg rounded-tr-lg`}
                  >
                    {plan.badgeText}
                  </div>
                )}
                <h4 className="text-2xl font-bold mb-2">{plan.displayName}</h4>
                {plan.originalPrice ? (
                  <div className="mb-4">
                    <p className="text-gray-500 line-through text-lg">
                      {plan.currency === 'KRW' ? '₩' : '$'}
                      {plan.originalPrice.toLocaleString()}/월
                    </p>
                    <p
                      className={`text-3xl font-bold ${
                        isHighlighted ? 'text-blue-600' : ''
                      }`}
                    >
                      {plan.currency === 'KRW' ? '₩' : '$'}
                      {plan.price.toLocaleString()}
                      <span className="text-base font-normal text-gray-700">/월</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-3xl font-bold mb-4">
                    {plan.currency === 'KRW' ? '₩' : '$'}
                    {plan.price.toLocaleString()}
                    <span className="text-base font-normal">/월</span>
                  </p>
                )}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register">
                  {plan.buttonVariant === 'outline' ? (
                    <Button variant="outline" className="w-full">
                      {plan.buttonText}
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${
                        isHighlighted ? 'bg-blue-600 hover:bg-blue-700' : ''
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
