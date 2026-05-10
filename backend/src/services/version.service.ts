import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export async function createVersion(documentId: string, content: Buffer) {
  return prisma.documentVersion.create({
    data: { documentId, content: new Uint8Array(content) },
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
  const version = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId },
  })
  if (!version) throw new AppError(404, 'Version not found')

  const result = await prisma.document.updateMany({
    where: { id: documentId, ownerId, isDeleted: false },
    data: { content: new Uint8Array(version.content), updatedAt: new Date() },
  })
  if (result.count === 0) throw new AppError(404, 'Document not found')

  await prisma.documentVersion.create({
    data: { documentId, content: new Uint8Array(version.content) },
  })

  return { id: documentId, restoredFromVersion: versionId }
}
