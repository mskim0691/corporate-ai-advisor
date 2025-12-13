const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Setting up initial credit policy...')

  // Check if policy already exists
  const existingPolicy = await prisma.initialCreditPolicy.findFirst()

  if (existingPolicy) {
    console.log('Initial credit policy already exists:', existingPolicy)
    return
  }

  // Create default initial credit policy
  const policy = await prisma.initialCreditPolicy.create({
    data: {
      credits: 1000, // Default 1000 credits for new users
      description: '신규 회원 웰컴 크레딧',
      isActive: true,
    },
  })

  console.log('Initial credit policy created:', policy)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
