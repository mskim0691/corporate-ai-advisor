"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [companyName, setCompanyName] = useState("")
  const [representative, setRepresentative] = useState("")
  const [additionalRequest, setAdditionalRequest] = useState("")

  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [userCredits, setUserCredits] = useState(0)

  useEffect(() => {
    fetchUserCredits()
  }, [])

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/info')
      if (response.ok) {
        const data = await response.json()
        setUserCredits(data.credits || 0)
      }
    } catch (err) {
      console.error('Failed to fetch user credits:', err)
    }
  }

  /* 크레딧 기능 비활성화
  const [basicAnalysisCost, setBasicAnalysisCost] = useState(10)

  useEffect(() => {
    fetchCreditPrices()
  }, [])

  const fetchCreditPrices = async () => {
    try {
      const response = await fetch('/api/admin/credit-prices')
      if (response.ok) {
        const priceData = await response.json()
        const basicPrice = priceData.find((p: any) => p.type === 'basic_analysis')
        if (basicPrice) {
          setBasicAnalysisCost(basicPrice.credits)
        }
      }
    } catch (err) {
      console.error('Failed to fetch credit prices:', err)
      // Keep default value of 10 if fetch fails
    }
  }
  */

  const handleNext = () => {
    if (!companyName || !representative) {
      setError("모든 필수 항목을 입력해주세요")
      return
    }

    setError("")
    setStep(2)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB in bytes

      // Check file sizes
      const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE)
      if (oversizedFiles.length > 0) {
        setError(`다음 파일의 크기가 4MB를 초과합니다: ${oversizedFiles.map(f => f.name).join(', ')}`)
        return
      }

      setError("")
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB in bytes

    // Check file sizes
    const oversizedFiles = droppedFiles.filter(file => file.size > MAX_FILE_SIZE)
    if (oversizedFiles.length > 0) {
      setError(`다음 파일의 크기가 4MB를 초과합니다: ${oversizedFiles.map(f => f.name).join(', ')}`)
      return
    }

    setError("")
    setFiles((prev) => [...prev, ...droppedFiles].slice(0, 5))
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError("최소 1개의 파일을 업로드해주세요")
      return
    }

    // 이용권 차감 확인
    const expectedCredits = userCredits - 1
    const confirmMessage = `솔루션 이용권이 -1 차감됩니다. 계속하시겠습니까?\n(예상 잔여 이용권: ${expectedCredits})`

    if (!confirm(confirmMessage)) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const projectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          businessNumber: "",
          representative,
          industry: undefined,
        }),
      })

      if (!projectResponse.ok) {
        throw new Error("프로젝트 생성에 실패했습니다")
      }

      const { projectId } = await projectResponse.json()

      // Upload files one by one to avoid Vercel's 4.5MB body size limit
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append("files", file)

        const uploadResponse = await fetch(`/api/projects/${projectId}/upload`, {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error(`파일 업로드에 실패했습니다: ${file.name}`)
        }
      }

      // additionalRequest 저장
      if (additionalRequest.trim()) {
        const updateResponse = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ additionalRequest }),
        })

        if (!updateResponse.ok) {
          throw new Error("추가 정보 저장에 실패했습니다")
        }
      }

      // processing 페이지로 이동 (분석은 processing 페이지에서 시작됨)
      router.push(`/projects/${projectId}/processing`)

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "오류가 발생했습니다")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">새 분석 프로젝트</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-300"}`}>
                1
              </div>
              <span className="ml-2 font-medium">기업 정보</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-300">
              <div className={`h-full ${step >= 2 ? "bg-blue-600" : ""}`} />
            </div>
            <div className={`flex items-center ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-300"}`}>
                2
              </div>
              <span className="ml-2 font-medium">파일 업로드</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>기업 정보 입력</CardTitle>
              <CardDescription>분석할 기업의 기본 정보를 입력해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">회사명 *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="예: 주식회사 ABC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="representative">대표자 이름 *</Label>
                <Input
                  id="representative"
                  value={representative}
                  onChange={(e) => setRepresentative(e.target.value)}
                  placeholder="예: 홍길동"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalRequest">추가 분석 요청 (선택사항)</Label>
                <textarea
                  id="additionalRequest"
                  value={additionalRequest}
                  onChange={(e) => setAdditionalRequest(e.target.value)}
                  className="w-full min-h-[120px] p-3 border rounded-md"
                  placeholder="기업에 대해 별도로 알게된 정보가 있다면 자유롭게 적어주세요. 내용이 자세할수록 적절한 솔루션을 제공해드립니다."
                />
              </div>

              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1"
                >
                  뒤로
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  다음
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>파일 업로드</CardTitle>
              <CardDescription>분석할 문서를 업로드해주세요 (최대 5개)</CardDescription>
              <div className="text-sm text-gray-600 mt-2">
                <p>기업정보(CRETOP 분석파일)이나 재무제표 등 최대한 자세한 정보를 올려주세요.</p>
                <p>AI엔진이 보다 자세한 분석을 할 수 있습니다.</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  isDragging ? "border-blue-600 bg-blue-50" : "border-gray-300"
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="mb-2 text-sm text-gray-600">
                  파일을 드래그 앤 드롭하거나 클릭하여 업로드
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  PDF, DOCX, XLSX, JPG, PNG (파일당 최대 4MB)
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>파일 선택</span>
                  </Button>
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>업로드된 파일 ({files.length}/5)</Label>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        삭제
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  이전
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || files.length === 0}
                  className="flex-1"
                >
                  {isLoading ? "AI엔진이 전략을 분석하고 있습니다. 시간이 조금 걸려도 기다려주세요~" : "분석시작 (이용권 -1)"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
