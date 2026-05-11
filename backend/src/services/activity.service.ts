import { prisma } from '../lib/prisma'
import { ActivityType } from '@prisma/client'

export async function logActivity(
  documentId: string,
  type: ActivityType,
  label: string,
): Promise<void> {
  try {
    await prisma.documentActivity.create({
      data: { documentId, type, label },
    })
  } catch (error) {
    // Silently swallow errors - activity failures must never break the main operation
  }
}