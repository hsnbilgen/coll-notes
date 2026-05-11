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

export async function saveShareForUser(token: string, userId: string) {
  const share = await prisma.documentShare.findUnique({
    where: { token },
    include: { document: { select: { isDeleted: true } } },
  })
  if (!share) throw new AppError(404, 'Share link not found')
  if (share.document.isDeleted) throw new AppError(404, 'Document has been deleted')
  if (share.expiresAt && share.expiresAt < new Date()) throw new AppError(410, 'Share link has expired')

  await prisma.savedShare.upsert({
    where: { userId_shareId: { userId, shareId: share.id } },
    create: { userId, shareId: share.id },
    update: {},
  })
}

export async function getSavedSharesForUser(userId: string) {
  const saved = await prisma.savedShare.findMany({
    where: { userId },
    orderBy: { savedAt: 'desc' },
    include: {
      share: {
        include: {
          document: {
            select: { id: true, title: true, isDeleted: true, updatedAt: true },
          },
        },
      },
    },
  })

  return saved
    .filter((s) => !s.share.document.isDeleted)
    .filter((s) => !s.share.expiresAt || s.share.expiresAt > new Date())
    .map((s) => ({
      shareToken: s.share.token,
      permission: s.share.permission,
      savedAt: s.savedAt,
      document: {
        id: s.share.document.id,
        title: s.share.document.title,
        updatedAt: s.share.document.updatedAt,
      },
    }))
}
