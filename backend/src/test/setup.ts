import { execFileSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL?.includes('/collnotes')) {
  throw new Error('DATABASE_URL must contain "/collnotes" to safely derive test database URL')
}
const TEST_DATABASE_URL = process.env.DATABASE_URL.replace('/collnotes', '/collnotes_test')

process.env.DATABASE_URL = TEST_DATABASE_URL
process.env.JWT_SECRET = 'test-secret'
process.env.JWT_EXPIRES_IN = '1h'
process.env.FRONTEND_URL = 'http://localhost:5173'

export const testPrisma = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
})

beforeAll(async () => {
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  })
})

beforeEach(async () => {
  await testPrisma.documentShare.deleteMany()
  await testPrisma.documentVersion.deleteMany()
  await testPrisma.document.deleteMany()
  await testPrisma.user.deleteMany()
})

afterAll(async () => {
  await testPrisma.$disconnect()
})
