'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <div className="h-[500px] bg-gray-100 animate-pulse rounded-lg" />
});

interface LegalDocument {
  id: string;
  type: string;
  title: string;
  content: string;
  version: string;
  updatedAt: string;
  createdAt: string;
}

export default function AdminLegalPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('terms');

  const [termsData, setTermsData] = useState({
    title: '',
    content: '',
    version: ''
  });

  const [privacyData, setPrivacyData] = useState({
    title: '',
    content: '',
    version: ''
  });

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/legal');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);

        const terms = data.find((d: LegalDocument) => d.type === 'terms');
        const privacy = data.find((d: LegalDocument) => d.type === 'privacy');

        if (terms) {
          setTermsData({
            title: terms.title,
            content: terms.content,
            version: terms.version
          });
        }

        if (privacy) {
          setPrivacyData({
            title: privacy.title,
            content: privacy.content,
            version: privacy.version
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch legal documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSave = async (type: 'terms' | 'privacy') => {
    setSaving(true);
    try {
      const data = type === 'terms' ? termsData : privacyData;
      const response = await fetch('/api/admin/legal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          ...data
        }),
      });

      if (response.ok) {
        alert('저장되었습니다.');
        fetchDocuments();
      } else {
        const errorData = await response.json();
        alert(errorData.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">약관 관리</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">약관 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          서비스 이용약관 및 개인정보처리방침을 관리합니다 (마크다운 형식)
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="terms">서비스 이용약관</TabsTrigger>
          <TabsTrigger value="privacy">개인정보처리방침</TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>서비스 이용약관</CardTitle>
              <CardDescription>
                전자상거래 표준약관을 기반으로 작성된 서비스 이용약관입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="terms-title">제목</Label>
                  <Input
                    id="terms-title"
                    value={termsData.title}
                    onChange={(e) => setTermsData({ ...termsData, title: e.target.value })}
                    placeholder="서비스 이용약관"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms-version">버전</Label>
                  <Input
                    id="terms-version"
                    value={termsData.version}
                    onChange={(e) => setTermsData({ ...termsData, version: e.target.value })}
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>내용 (마크다운)</Label>
                <div data-color-mode="light">
                  <MDEditor
                    value={termsData.content}
                    onChange={(value) => setTermsData({ ...termsData, content: value || '' })}
                    height={500}
                    preview="live"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <p className="text-sm text-gray-500">
                  {documents.find(d => d.type === 'terms')?.updatedAt && (
                    <>최종 수정: {new Date(documents.find(d => d.type === 'terms')!.updatedAt).toLocaleString('ko-KR')}</>
                  )}
                </p>
                <Button onClick={() => handleSave('terms')} disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>개인정보처리방침</CardTitle>
              <CardDescription>
                개인정보 보호법에 따른 개인정보처리방침입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="privacy-title">제목</Label>
                  <Input
                    id="privacy-title"
                    value={privacyData.title}
                    onChange={(e) => setPrivacyData({ ...privacyData, title: e.target.value })}
                    placeholder="개인정보처리방침"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="privacy-version">버전</Label>
                  <Input
                    id="privacy-version"
                    value={privacyData.version}
                    onChange={(e) => setPrivacyData({ ...privacyData, version: e.target.value })}
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>내용 (마크다운)</Label>
                <div data-color-mode="light">
                  <MDEditor
                    value={privacyData.content}
                    onChange={(value) => setPrivacyData({ ...privacyData, content: value || '' })}
                    height={500}
                    preview="live"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <p className="text-sm text-gray-500">
                  {documents.find(d => d.type === 'privacy')?.updatedAt && (
                    <>최종 수정: {new Date(documents.find(d => d.type === 'privacy')!.updatedAt).toLocaleString('ko-KR')}</>
                  )}
                </p>
                <Button onClick={() => handleSave('privacy')} disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
