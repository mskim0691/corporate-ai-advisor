'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
  bgColor: string | null;
  textColor: string | null;
  order: number;
}

export function RotatingBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/banners');
        if (response.ok) {
          const data = await response.json();
          setBanners(data);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [banners.length, isPaused, nextSlide]);

  if (loading) {
    return (
      <section className="relative h-[400px] bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </section>
    );
  }

  if (banners.length === 0) {
    return (
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6">
          AI 기반 법인 컨설팅 비서
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          기업정보를 업로드하면 AI 분석 리포트를 생성합니다.
        </p>
        <Link href="/auth/register">
          <Button size="lg" className="text-lg px-8 py-6">
            지금 시작하기
          </Button>
        </Link>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];
  const bgColorClass = currentBanner.bgColor || 'bg-gradient-to-r from-blue-600 to-blue-800';
  const textColorClass = currentBanner.textColor || 'text-white';

  return (
    <section
      className={`relative min-h-[400px] ${bgColorClass} overflow-hidden`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={currentBanner.imageUrl ? {
        backgroundImage: `url(${currentBanner.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      {currentBanner.imageUrl && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      <div className={`relative container mx-auto px-4 py-20 ${textColorClass}`}>
        <div className="max-w-3xl mx-auto text-center">
          {currentBanner.subtitle && (
            <p className="text-lg mb-4 opacity-90">
              {currentBanner.subtitle}
            </p>
          )}
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {currentBanner.title}
          </h2>
          {currentBanner.description && (
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {currentBanner.description}
            </p>
          )}
          {currentBanner.buttonText && currentBanner.buttonLink && (
            <Link href={currentBanner.buttonLink}>
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-white text-gray-900 hover:bg-gray-100"
              >
                {currentBanner.buttonText}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="이전 배너"
          >
            <ChevronLeft className={`w-6 h-6 ${textColorClass}`} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="다음 배너"
          >
            <ChevronRight className={`w-6 h-6 ${textColorClass}`} />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-white'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`배너 ${index + 1}로 이동`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
