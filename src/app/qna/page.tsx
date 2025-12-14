import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import QnaClient from "./qna-client"

async function getUserInquiries(userId: string) {
  const inquiries = await prisma.inquiry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  return inquiries
}

export default async function QnaPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const inquiries = await getUserInquiries(session.user.id)

  return <QnaClient inquiries={inquiries} />
}
