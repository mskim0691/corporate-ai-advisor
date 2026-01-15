'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Coupon {
  id: string;
  code: string;
  plan: string;
  durationDays: number;
  redeemedBy: string | null;
  redeemedAt: string | null;
  expiresAt: string | null;
  batchId: string | null;
  note: string | null;
  createdAt: string;
}

interface Batch {
  batchId: string;
  count: number;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('');

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createCount, setCreateCount] = useState(10);
  const [createNote, setCreateNote] = useState('');
  const [creating, setCreating] = useState(false);

  // Generated codes dialog
  const [showCodesDialog, setShowCodesDialog] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [generatedBatchId, setGeneratedBatchId] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, [page, statusFilter, batchFilter]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        status: statusFilter,
      });
      if (batchFilter) {
        params.set('batchId', batchFilter);
      }

      const response = await fetch(`/api/admin/coupons?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons);
        setTotalPages(data.pagination.totalPages);
        setBatches(data.batches);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (createCount < 1 || createCount > 1000) {
      alert('생성 개수는 1~1000 사이여야 합니다');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: createCount,
          plan: 'pro',
          durationDays: 30,
          note: createNote || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedCodes(data.codes);
        setGeneratedBatchId(data.batchId);
        setShowCreateDialog(false);
        setShowCodesDialog(true);
        setCreateCount(10);
        setCreateNote('');
        fetchCoupons();
      } else {
        const error = await response.json();
        alert(error.error || '쿠폰 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to create coupons:', error);
      alert('쿠폰 생성 중 오류가 발생했습니다');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('이 배치의 미사용 쿠폰을 모두 삭제하시겠습니까?')) return;

    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchCoupons();
      } else {
        const error = await response.json();
        alert(error.error || '삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete batch:', error);
      alert('삭제 중 오류가 발생했습니다');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('복사되었습니다');
  };

  const copyAllCodes = () => {
    const text = generatedCodes.join('\n');
    navigator.clipboard.writeText(text);
    alert(`${generatedCodes.length}개의 쿠폰 코드가 복사되었습니다`);
  };

  const downloadAsCsv = () => {
    const header = '쿠폰코드,플랜,유효기간(일)\n';
    const rows = generatedCodes.map(code => `${code},pro,30`).join('\n');
    const csv = header + rows;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupons-${generatedBatchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">이용권 쿠폰 관리</h1>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">이용권 쿠폰 관리</h1>
        <Button onClick={() => setShowCreateDialog(true)}>쿠폰 생성</Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">상태</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border rounded px-3 py-2"
              >
                <option value="all">전체</option>
                <option value="unused">미사용</option>
                <option value="used">사용됨</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">배치</label>
              <select
                value={batchFilter}
                onChange={(e) => {
                  setBatchFilter(e.target.value);
                  setPage(1);
                }}
                className="border rounded px-3 py-2"
              >
                <option value="">전체</option>
                {batches.map((batch) => (
                  <option key={batch.batchId} value={batch.batchId || ''}>
                    {batch.batchId} ({batch.count}개)
                  </option>
                ))}
              </select>
            </div>
            {batchFilter && (
              <div className="flex items-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteBatch(batchFilter)}
                >
                  배치 삭제 (미사용만)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">총 쿠폰</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{coupons.length > 0 ? totalPages * 50 : 0}+</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">미사용</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {coupons.filter((c) => !c.redeemedBy).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">사용됨</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {coupons.filter((c) => c.redeemedBy).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">쿠폰 코드</th>
                  <th className="text-left py-2 px-2">플랜</th>
                  <th className="text-left py-2 px-2">유효기간</th>
                  <th className="text-left py-2 px-2">상태</th>
                  <th className="text-left py-2 px-2">사용자</th>
                  <th className="text-left py-2 px-2">만료일</th>
                  <th className="text-left py-2 px-2">배치</th>
                  <th className="text-left py-2 px-2">액션</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-mono">{coupon.code}</td>
                    <td className="py-2 px-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {coupon.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2">{coupon.durationDays}일</td>
                    <td className="py-2 px-2">
                      {coupon.redeemedBy ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          사용됨
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          미사용
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-xs text-gray-500">
                      {coupon.redeemedBy ? coupon.redeemedBy.substring(0, 8) + '...' : '-'}
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                    <td className="py-2 px-2 text-xs text-gray-500">
                      {coupon.batchId ? coupon.batchId.replace('BATCH-', '') : '-'}
                    </td>
                    <td className="py-2 px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(coupon.code)}
                      >
                        복사
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                이전
              </Button>
              <span className="py-2 px-4">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>쿠폰 생성</DialogTitle>
            <DialogDescription>
              Pro 플랜 이용권 쿠폰을 생성합니다. 유효기간은 30일입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">생성 개수</label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={createCount}
                onChange={(e) => setCreateCount(parseInt(e.target.value) || 1)}
                placeholder="1~1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">메모 (선택)</label>
              <Input
                value={createNote}
                onChange={(e) => setCreateNote(e.target.value)}
                placeholder="예: 2024년 1월 기업고객 배포용"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? '생성 중...' : `${createCount}개 생성`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Codes Dialog */}
      <Dialog open={showCodesDialog} onOpenChange={setShowCodesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>쿠폰 생성 완료</DialogTitle>
            <DialogDescription>
              {generatedCodes.length}개의 쿠폰이 생성되었습니다. 배치 ID: {generatedBatchId}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" onClick={copyAllCodes}>
              전체 복사
            </Button>
            <Button variant="outline" onClick={downloadAsCsv}>
              CSV 다운로드
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto border rounded p-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {generatedCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded"
                >
                  <span>{code}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code)}
                  >
                    복사
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCodesDialog(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
