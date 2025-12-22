import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

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
          <h2 className="text-3xl font-bold text-center mb-8">서비스 소개</h2>

          {content ? (
            <div
              className="prose prose-lg max-w-none bg-white rounded-lg shadow-sm p-8"
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
