import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UserRole, UserStatus } from '../lib/generated/prisma/client'

const email = process.argv[2]?.trim().toLowerCase()
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!email) {
  console.error('Usage: npm run admin:promote -- admin@example.com')
  process.exit(1)
}

if (!connectionString) {
  console.error('DIRECT_URL or DATABASE_URL is required.')
  process.exit(1)
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      authUserId: true,
      role: true,
    },
  })

  if (!user) {
    throw new Error(
      'User not found. Sign up, verify the email, and log in once before promoting this account.',
    )
  }

  if (!user.authUserId) {
    throw new Error(
      'This user is not linked to Supabase Auth. Log in with this email once, then run the command again.',
    )
  }

  if (user.role === UserRole.admin) {
    console.log(`${email} is already an admin.`)
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: UserRole.admin,
      status: UserStatus.active,
    },
  })

  console.log(`Promoted ${email} to admin.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
