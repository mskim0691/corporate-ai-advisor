const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setAdmin() {
  try {
    const user = await prisma.user.update({
      where: { email: 'admin@admin.com' },
      data: { role: 'admin' }
    })

    console.log('✅ Successfully updated user role to admin:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Name: ${user.name || '(no name)'}`)
  } catch (error) {
    if (error.code === 'P2025') {
      console.error('❌ User not found with email: admin@admin.com')
      console.log('💡 Please create the user first or check the email address')
    } else {
      console.error('❌ Error updating user:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

setAdmin()
