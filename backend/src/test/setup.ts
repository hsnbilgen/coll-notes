import { config } from 'dotenv'
import { execFileSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

config() // load .env before anything reads process.env

if (!process.env.DATABASE_URL?.includes('/collnotes')) {
  throw new Error('DATABASE_URL must contain "/collnotes" to safely derive test database URL')
}
const TEST_DATABASE_URL = process.env.DATABASE_URL.replace('/collnotes', '/collnotes_test')

process.env.DATABASE_URL = TEST_DATABASE_URL
process.env.JWT_SECRET = 'test-secret'
process.env.JWT_EXPIRES_IN = '1h'
process.env.FRONTEND_URL = 'http://localhost:5173'

const testPool = new Pool({ connectionString: TEST_DATABASE_URL })
export const testPrisma = new PrismaClient({
  adapter: new PrismaPg(testPool),
})

beforeAll(async () => {
  execFileSync('./node_modules/.bin/prisma', ['migrate', 'deploy'], {
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
  await testPool.end()
})
