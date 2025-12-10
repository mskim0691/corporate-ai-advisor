const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const email = `test-${Date.now()}@example.com`
        const user = await prisma.user.create({
            data: {
                email: email,
                passwordHash: 'hashedpassword',
                name: 'Test User',
                subscription: {
                    create: {
                        plan: 'free',
                        status: 'active',
                    },
                },
            },
        })
        console.log('Successfully created user:', user)
    } catch (e) {
        console.error('Error creating user:', e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
