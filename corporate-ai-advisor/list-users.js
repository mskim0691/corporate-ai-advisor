import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
          }
        },
        _count: {
          select: {
            projects: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n총 회원 수: ${users.length}명\n`)
    console.log('=' .repeat(80))

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || '이름 없음'}`)
      console.log(`   이메일: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   구독: ${user.subscription?.plan || 'Free'} (${user.subscription?.status || 'active'})`)
      console.log(`   프로젝트 수: ${user._count.projects}개`)
      console.log(`   가입일: ${new Date(user.createdAt).toLocaleString('ko-KR')}`)
    })

    console.log('\n' + '='.repeat(80) + '\n')

  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()
