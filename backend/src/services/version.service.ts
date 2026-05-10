import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export async function createVersion(documentId: string, content: Buffer) {
  return prisma.documentVersion.create({
    data: { documentId, content },
    select: { id: true, documentId: true, createdAt: true },
  })
}

export async function listVersions(documentId: string, ownerId: string) {
  const doc = await prisma.document.findFirst({ where: { id: documentId, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')

  return prisma.documentVersion.findMany({
    where: { documentId },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function restoreVersion(documentId: string, versionId: string, ownerId: string) {
  const doc = await prisma.document.findFirst({ where: { id: documentId, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')

  const version = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId },
  })
  if (!version) throw new AppError(404, 'Version not found')

  await prisma.document.update({
    where: { id: documentId },
    data: { content: version.content, updatedAt: new Date() },
  })

  await prisma.documentVersion.create({
    data: { documentId, content: version.content },
  })

  return { id: documentId, restoredFromVersion: versionId }
}
