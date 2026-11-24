import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function getPrismaClient(): PrismaClient {
  // If running on Vercel or AWS Lambda where root filesystem is read-only except /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = '/tmp/dev.db'
    const sourceDbPath = path.join(process.cwd(), 'prisma', 'dev.db')

    // Copy bundled seed database to /tmp if it doesn't already exist in the container instance
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
      try {
        fs.copyFileSync(sourceDbPath, tmpDbPath)
      } catch (err) {
        console.error('Vercel cold start: failed to copy database to /tmp:', err)
      }
    }

    return new PrismaClient({
      datasources: {
        db: {
          url: `file:${tmpDbPath}`
        }
      }
    })
  }

  // Local environment or custom DATABASE_URL
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
