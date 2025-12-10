import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"

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

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">가격 플랜</h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="p-8 border-2 rounded-lg bg-white">
                <h4 className="text-2xl font-bold mb-2">Free</h4>
                <p className="text-3xl font-bold mb-4">₩0<span className="text-base font-normal">/월</span></p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>월 <strong>4회</strong> 분석</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>PDF 다운로드</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>기본 지원</span>
                  </li>
                </ul>
                <Link href="/auth/register">
                  <Button variant="outline" className="w-full">무료로 시작하기</Button>
                </Link>
              </div>
              <div className="p-8 border-2 border-blue-600 rounded-lg bg-blue-50 relative">
                <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg rounded-tr-lg">
                  50% 할인 이벤트
                </div>
                <h4 className="text-2xl font-bold mb-2">Standard</h4>
                <div className="mb-4">
                  <p className="text-gray-500 line-through text-lg">₩30,000/월</p>
                  <p className="text-3xl font-bold text-blue-600">
                    ₩15,000<span className="text-base font-normal text-gray-700">/월</span>
                  </p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>월 <strong>30회</strong> 분석</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>PDF 다운로드</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>우선 지원</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>프리미엄 기능</span>
                  </li>
                </ul>
                <Link href="/auth/register">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">지금 시작하기</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 AI-GFC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
