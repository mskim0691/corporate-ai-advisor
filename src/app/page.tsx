import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { PricingSection } from "@/components/pricing-section"
import { RotatingBanner } from "@/components/rotating-banner"
import { Footer } from "@/components/footer"

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI-GFC</h1>
          <div className="flex items-center gap-4">
            <Link href="/service-intro">
              <Button variant="outline">서비스소개</Button>
            </Link>
            {session?.user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline">대시보드</Button>
                </Link>
                <Link href="/myinfo">
                  <Button>회원 정보</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/pricing">
                  <Button variant="outline">구독</Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline">로그인</Button>
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-6 border rounded-lg">
                <h4 className="text-xl font-semibold mb-3">간편한 문서 업로드</h4>
                <p className="text-gray-600">
                  재무제표, 사업계획서 등을 드래그 앤 드롭으로 간편하게 업로드
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h4 className="text-xl font-semibold mb-3">AI 심층 분석 솔루션 제공</h4>
                <p className="text-gray-600 mb-2">
                  첨단 AI 엔진이 기업정보를 분석하여 인사이트와 세일즈 화법(스크립트)까지 제공
                </p>
                <a
                  href="/analysis_solution_sample.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  샘플 문서 보기
                </a>
              </div>
              <div className="p-6 border rounded-lg">
                <h4 className="text-xl font-semibold mb-3">고급 비주얼 레포트 생성</h4>
                <p className="text-gray-600 mb-2">
                  AI 기반 비주얼 레포트 제작
                </p>
                <a
                  href="/visual_report_sample.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  샘플 레포트 보기
                </a>
              </div>
              <div className="p-6 border rounded-lg">
                <h4 className="text-xl font-semibold mb-3">1차 상담후 후속 대응 제안</h4>
                <p className="text-gray-600">
                  대표님과 상담 이후 결과를 반영하여 추가 대응방안 제공
                </p>
              </div>
            </div>
          </div>
        </section>

        <PricingSection />
      </main>

      <Footer />
    </div>
  )
}
