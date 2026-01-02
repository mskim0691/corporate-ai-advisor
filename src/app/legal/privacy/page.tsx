'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import '@uiw/react-markdown-preview/markdown.css';

const MarkdownPreview = dynamic(() => import('@uiw/react-markdown-preview'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
});

export default function PrivacyPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    fetchPrivacy();
  }, []);

  const fetchPrivacy = async () => {
    try {
      const response = await fetch('/api/legal/privacy');
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
        setUpdatedAt(data.updatedAt);
      }
    } catch (error) {
      console.error('Failed to fetch privacy policy:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">AI-GFC</h1>
          </Link>
          <Link href="/">
            <Button variant="outline">홈으로</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">로딩 중...</p>
            </div>
          ) : (
            <>
              <div data-color-mode="light">
                <MarkdownPreview source={content} style={{ padding: 0, backgroundColor: 'transparent' }} />
              </div>
              {updatedAt && (
                <p className="text-sm text-gray-500 mt-8 pt-4 border-t">
                  최종 수정일: {new Date(updatedAt).toLocaleDateString('ko-KR')}
                </p>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 AI-GFC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
