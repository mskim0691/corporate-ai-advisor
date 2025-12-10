import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateSubscription(email, newPlan) {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true }
    })

    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      return
    }

    console.log(`\n현재 사용자 정보:`)
    console.log(`  이름: ${user.name}`)
    console.log(`  이메일: ${user.email}`)
    console.log(`  현재 구독: ${user.subscription?.plan || 'Free'}`)

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan: newPlan,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    })

    console.log(`\n✅ 구독 플랜이 성공적으로 변경되었습니다!`)
    console.log(`  새로운 구독: ${updatedSubscription.plan}`)
    console.log(`  상태: ${updatedSubscription.status}`)
    console.log(`  만료일: ${new Date(updatedSubscription.currentPeriodEnd).toLocaleString('ko-KR')}\n`)

  } catch (error) {
    console.error('❌ Error updating subscription:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Execute
const email = process.argv[2] || 'wwkms@naver.com'
const plan = process.argv[3] || 'pro'

updateSubscription(email, plan)
