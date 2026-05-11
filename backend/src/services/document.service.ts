import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { logActivity } from './activity.service'

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

  const document = await prisma.document.create({
    data: { ownerId, title },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })

  logActivity(document.id, 'CREATED', 'Document created').catch(() => {})

  return document
}

export async function renameDocument(id: string, ownerId: string, title: string) {
  const result = await prisma.document.updateMany({
    where: { id, ownerId, isDeleted: false },
    data: { title },
  })
  if (result.count === 0) throw new AppError(404, 'Document not found')

  logActivity(id, 'RENAMED', 'Document renamed').catch(() => {})

  return prisma.document.findUnique({ where: { id } })
}

export async function softDeleteDocument(id: string, ownerId: string) {
  const result = await prisma.document.updateMany({
    where: { id, ownerId, isDeleted: false },
    data: { isDeleted: true, deletedAt: new Date() },
  })
  if (result.count === 0) throw new AppError(404, 'Document not found')
}

export async function hardDeleteDocument(id: string, ownerId: string) {
  const result = await prisma.document.deleteMany({
    where: { id, ownerId, isDeleted: true },
  })
  if (result.count === 0) throw new AppError(404, 'Document not found in trash')
}

export async function restoreDocument(id: string, ownerId: string) {
  const result = await prisma.document.updateMany({
    where: { id, ownerId, isDeleted: true },
    data: { isDeleted: false, deletedAt: null },
  })
  if (result.count === 0) throw new AppError(404, 'Document not found')

  logActivity(id, 'CREATED', 'Document restored from trash').catch(() => {})

  return prisma.document.findUnique({ where: { id } })
}

export async function duplicateDocument(id: string, ownerId: string) {
  const source = await prisma.document.findFirst({
    where: { id, ownerId, isDeleted: false },
  })
  if (!source) throw new AppError(404, 'Document not found')

  const copyTitle = `Copy of ${source.title}`
  const newDocument = await prisma.document.create({
    data: {
      ownerId,
      title: copyTitle,
      content: source.content ? new Uint8Array(source.content) : undefined,
    },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })

  logActivity(newDocument.id, 'CREATED', 'Document created').catch(() => {})

  return newDocument
}

export async function saveDocumentContent(id: string, ownerId: string, content: Buffer) {
  const result = await prisma.document.updateMany({
    where: { id, ownerId, isDeleted: false },
    data: { content: new Uint8Array(content) },
  })
  if (result.count === 0) throw new AppError(404, 'Document not found')

  logActivity(id, 'EDITED', 'Document edited').catch(() => {})
}

export async function getDocumentActivity(id: string, ownerId: string) {
  const doc = await prisma.document.findFirst({
    where: { id, ownerId, isDeleted: false },
    select: { id: true },
  })
  if (!doc) throw new AppError(404, 'Document not found')

  const activities = await prisma.documentActivity.findMany({
    where: { documentId: id },
    select: { type: true, label: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return activities.map((a) => ({
    type: a.type.toLowerCase(),
    timestamp: a.createdAt,
    label: a.label,
  }))
}
