"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface SampleReport {
  id: string;
  imageUrl: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function SampleReportsPage() {
  const [sampleReports, setSampleReports] = useState<SampleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');

  useEffect(() => {
    fetchSampleReports();
  }, []);

  const fetchSampleReports = async () => {
    try {
      const response = await fetch('/api/admin/sample-reports');
      const data = await response.json();
      if (response.ok) {
        setSampleReports(data.sampleReports || []);
      }
    } catch (error) {
      console.error('Failed to fetch sample reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) {
      alert('이미지 URL을 입력해주세요');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch('/api/admin/sample-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: newImageUrl,
          order: sampleReports.length,
        }),
      });

      if (response.ok) {
        setNewImageUrl('');
        await fetchSampleReports();
        alert('샘플 이미지가 추가되었습니다');
      } else {
        const data = await response.json();
        alert(data.error || '이미지 추가에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to add image:', error);
      alert('이미지 추가 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/sample-reports/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchSampleReports();
        alert('샘플 이미지가 업로드되었습니다');
        // Reset file input
        event.target.value = '';
      } else {
        const data = await response.json();
        alert(data.error || '이미지 업로드에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('이미지 업로드 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('이 샘플 이미지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/sample-reports/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSampleReports();
        alert('샘플 이미지가 삭제되었습니다');
      } else {
        const data = await response.json();
        alert(data.error || '이미지 삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('이미지 삭제 중 오류가 발생했습니다');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('모든 샘플 이미지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/sample-reports', {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSampleReports();
        alert('모든 샘플 이미지가 삭제되었습니다');
      } else {
        const data = await response.json();
        alert(data.error || '이미지 삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete all images:', error);
      alert('이미지 삭제 중 오류가 발생했습니다');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">비주얼 레포트 샘플 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          사용자에게 보여줄 비주얼 레포트 샘플 이미지를 관리합니다.
        </p>
      </div>

      {/* 이미지 추가 섹션 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>새 샘플 이미지 추가</CardTitle>
          <CardDescription>
            파일을 직접 업로드하거나 이미지 URL을 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 업로드 방식 선택 탭 */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={uploadMethod === 'file' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadMethod('file')}
            >
              파일 업로드
            </Button>
            <Button
              variant={uploadMethod === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadMethod('url')}
            >
              URL 입력
            </Button>
          </div>

          {/* 파일 업로드 */}
          {uploadMethod === 'file' && (
            <div>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <span className="text-sm text-gray-500">업로드 중...</span>}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG, GIF 등의 이미지 파일을 업로드할 수 있습니다 (최대 5MB)
              </p>
            </div>
          )}

          {/* URL 입력 */}
          {uploadMethod === 'url' && (
            <div>
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder="이미지 URL (예: https://example.com/image.jpg)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddImage} disabled={uploading}>
                  {uploading ? '추가 중...' : '추가'}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                외부 이미지 URL을 입력하여 추가할 수 있습니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 샘플 이미지 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>등록된 샘플 이미지 ({sampleReports.length}개)</CardTitle>
            <CardDescription>클릭하여 이미지를 크게 볼 수 있습니다</CardDescription>
          </div>
          {sampleReports.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              전체 삭제
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {sampleReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>등록된 샘플 이미지가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sampleReports.map((report) => (
                <div key={report.id} className="relative group">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={report.imageUrl}
                      alt="샘플"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(report.imageUrl, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteImage(report.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{report.imageUrl}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
