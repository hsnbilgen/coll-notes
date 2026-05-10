import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export async function listDocuments(ownerId: string) {
  return prisma.document.findMany({
    where: { ownerId, isDeleted: false },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function listDeletedDocuments(ownerId: string) {
  return prisma.document.findMany({
    where: { ownerId, isDeleted: true },
    select: { id: true, title: true, deletedAt: true },
    orderBy: { deletedAt: 'desc' },
  })
}

export async function createDocument(ownerId: string) {
  const existing = await prisma.document.findMany({
    where: { ownerId, isDeleted: false, title: { startsWith: 'Untitled' } },
    select: { title: true },
  })

  let title = 'Untitled'
  if (existing.some((d) => d.title === 'Untitled')) {
    const nums = existing
      .map((d) => d.title.match(/^Untitled-(\d+)$/)?.[1])
      .filter(Boolean)
      .map(Number)
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
    title = `Untitled-${next}`
  }

  return prisma.document.create({
    data: { ownerId, title },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })
}

export async function renameDocument(id: string, ownerId: string, title: string) {
  const result = await prisma.document.updateMany({
    where: { id, ownerId, isDeleted: false },
    data: { title },
  })
  if (result.count === 0) throw new AppError(404, 'Document not found')
  return prisma.document.findUnique({ where: { id } })
}

export async function softDeleteDocument(id: string, ownerId: string) {
  const result = await prisma.document.updateMany({
    where: { id, ownerId, isDeleted: false },
    data: { isDeleted: true, deletedAt: new Date() },
  })
  if (result.count === 0) throw new AppError(404, 'Document not found')
}

export async function restoreDocument(id: string, ownerId: string) {
  const result = await prisma.document.updateMany({
    where: { id, ownerId, isDeleted: true },
    data: { isDeleted: false, deletedAt: null },
  })
  if (result.count === 0) throw new AppError(404, 'Document not found')
  return prisma.document.findUnique({ where: { id } })
}

export async function duplicateDocument(id: string, ownerId: string) {
  const source = await prisma.document.findFirst({
    where: { id, ownerId, isDeleted: false },
  })
  if (!source) throw new AppError(404, 'Document not found')

  const copyTitle = `Copy of ${source.title}`
  return prisma.document.create({
    data: {
      ownerId,
      title: copyTitle,
      content: source.content ? new Uint8Array(source.content) : undefined,
    },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })
}

export async function saveDocumentContent(id: string, ownerId: string, content: Buffer) {
  const result = await prisma.document.updateMany({
    where: { id, ownerId, isDeleted: false },
    data: { content: new Uint8Array(content) },
  })
  if (result.count === 0) throw new AppError(404, 'Document not found')
}

export async function getDocumentActivity(id: string, ownerId: string) {
  const doc = await prisma.document.findFirst({
    where: { id, ownerId, isDeleted: false },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })
  if (!doc) throw new AppError(404, 'Document not found')

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: id },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const activity = [
    { type: 'created', timestamp: doc.createdAt, label: 'Document created' },
    ...versions.map((v) => ({ type: 'edited', timestamp: v.createdAt, label: 'Document saved' })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return activity
}
