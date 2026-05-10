import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { SharePermission } from '@prisma/client'

export async function createShare(
  documentId: string,
  ownerId: string,
  permission: SharePermission,
  expiresAt?: Date
) {
  const doc = await prisma.document.findFirst({ where: { id: documentId, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')

  const share = await prisma.documentShare.create({
    data: { documentId, permission, expiresAt },
    select: { token: true, permission: true },
  })

  const url = `${process.env.FRONTEND_URL}/share/${share.token}`
  return { token: share.token, permission: share.permission, url }
}

export async function resolveShare(token: string) {
  const share = await prisma.documentShare.findUnique({
    where: { token },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!share) throw new AppError(404, 'Share link not found')
  if (share.document.isDeleted) throw new AppError(404, 'Document has been deleted')
  if (share.expiresAt && share.expiresAt < new Date()) throw new AppError(410, 'Share link has expired')

  return { document: share.document, permission: share.permission }
}
