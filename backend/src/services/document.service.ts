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
  return prisma.document.create({
    data: { ownerId, title: 'Untitled' },
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

export async function saveDocumentContent(id: string, ownerId: string, content: Buffer) {
  const result = await prisma.document.updateMany({
    where: { id, ownerId, isDeleted: false },
    data: { content },
  })
  if (result.count === 0) throw new AppError(404, 'Document not found')
}
