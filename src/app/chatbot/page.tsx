import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { Footer } from "@/components/footer"
import { ConsultingChatbot } from "@/components/consulting-chatbot"
import prisma from "@/lib/prisma"

export default async function ChatbotPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })
  const isAdmin = fullUser?.role === "admin"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <Link href="/">
              <h1 className="text-xl md:text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors">AI-GFC</h1>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7 md:h-9 md:px-4 md:text-sm">관리</Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7 md:h-9 md:px-4 md:text-sm">대시보드</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7 md:h-9 md:px-4 md:text-sm">구독 관리</Button>
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-2xl font-bold">법인컨설팅 AI</h2>
          <span className="text-gray-500">|</span>
          <p className="text-gray-600">
            법인세, 가업승계, 임원 관련, 4대보험 등 <span className="font-semibold text-blue-600">법인컨설팅</span> 관련 질문을 해보세요.
          </p>
        </div>

        <div className="flex-1 max-w-4xl w-full mx-auto" style={{ minHeight: "600px" }}>
          <ConsultingChatbot inline />
        </div>
      </main>

      <Footer />
    </div>
  )
}
