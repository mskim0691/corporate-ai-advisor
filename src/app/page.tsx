import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { PricingSection } from "@/components/pricing-section"
import { RotatingBanner } from "@/components/rotating-banner"

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI-GFC</h1>
          <div className="space-x-4">
            <Link href="/service-intro">
              <Button variant="ghost">서비스소개</Button>
            </Link>
            {session?.user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">대시보드</Button>
                </Link>
                <Link href="/myinfo">
                  <Button>회원 정보</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">로그인</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>회원가입(무료)</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <RotatingBanner />

        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">주요 기능</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border rounded-lg">
                <h4 className="text-xl font-semibold mb-3">간편한 문서 업로드</h4>
                <p className="text-gray-600">
                  재무제표, 사업계획서 등을 드래그 앤 드롭으로 간편하게 업로드
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h4 className="text-xl font-semibold mb-3">AI 자동 분석</h4>
                <p className="text-gray-600 mb-2">
                  첨단 AI 엔진이 기업정보를 분석하여 인사이트 제공
                </p>
                <a
                  href="/sample-report.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  샘플 문서 보기
                </a>
              </div>
              <div className="p-6 border rounded-lg">
                <h4 className="text-xl font-semibold mb-3">컨설팅 제안서 생성</h4>
                <p className="text-gray-600">
                  핵심 컨설팅 전략 및 판매화법 제공
                </p>
              </div>
            </div>
          </div>
        </section>

        <PricingSection />
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <p>&copy; 2025 AI-GFC. All rights reserved.</p>
          </div>
          <div className="text-center text-sm text-gray-400 space-y-1">
            <p>상호명: 이엑스이사일일 (566-57-00450) | 대표자: 김민수</p>
            <p>주소: 서울특별시 강동구 강동대로55길 39, 101동 603호</p>
            <p>유선번호: 070-8064-8232</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
