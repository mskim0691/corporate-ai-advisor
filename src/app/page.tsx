import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { PricingSection } from "@/components/pricing-section"

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI-GFC</h1>
          <div className="space-x-4">
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
                <p className="text-gray-600">
                  첨단 AI 엔진이 기업정보를 분석하여 인사이트 제공
                </p>
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
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 AI-GFC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
