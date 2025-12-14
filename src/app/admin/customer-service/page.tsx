import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { CustomerServiceClient } from "./customer-service-client"

export default async function AdminCustomerServicePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== "admin") {
    redirect("/dashboard")
  }

  // Get all inquiries with user info
  const inquiries = await prisma.inquiry.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: [
      { status: "asc" }, // pending first
      { createdAt: "desc" },
    ],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">고객센터</h1>
        <p className="mt-2 text-sm text-gray-600">
          고객 문의 및 답변 관리
        </p>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-8">
              <div>
                <p className="text-sm font-medium text-gray-600">총 문의</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{inquiries.length}건</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">답변 대기</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {inquiries.filter(i => i.status === 'pending').length}건
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">답변 완료</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {inquiries.filter(i => i.status === 'answered').length}건
                </p>
              </div>
            </div>
            <div className="text-5xl">💬</div>
          </div>
        </CardContent>
      </Card>

      <CustomerServiceClient initialInquiries={inquiries} />
    </div>
  )
}
