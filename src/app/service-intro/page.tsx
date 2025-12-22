import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Disable caching to always show the latest content
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getServiceIntro() {
  const serviceIntro = await prisma.serviceIntro.findFirst({
    orderBy: { updatedAt: "desc" },
  })
  return serviceIntro?.content || ""
}

export default async function ServiceIntroPage() {
  const session = await auth()
  const content = await getServiceIntro()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">AI-GFC</h1>
          </Link>
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

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">대표님의 마음을 여는 단 하나의 열쇠, AI-GFC</h2>

          {content ? (
            <div
              className="prose prose-lg max-w-none bg-white rounded-lg shadow-sm p-8 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mb-2 [&_h4]:mt-3 [&_p]:mb-4 [&_p]:leading-relaxed [&_br]:block [&_br]:content-[''] [&_br]:mt-2 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-100 [&_th]:font-bold [&_a]:text-blue-600 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4 [&_hr]:my-6 [&_hr]:border-gray-300 [&_.ql-indent-1]:pl-8 [&_.ql-indent-2]:pl-16 [&_.ql-indent-3]:pl-24 [&_[style*='line-height']]:!leading-[inherit]"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm">
              <p>서비스 소개 내용이 아직 등록되지 않았습니다.</p>
            </div>
          )}
        </div>
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
