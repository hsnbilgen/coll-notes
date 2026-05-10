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
  const doc = await prisma.document.findFirst({ where: { id, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')
  return prisma.document.update({
    where: { id },
    data: { title },
    select: { id: true, title: true, updatedAt: true },
  })
}

export async function softDeleteDocument(id: string, ownerId: string) {
  const doc = await prisma.document.findFirst({ where: { id, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')
  return prisma.document.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
    select: { id: true },
  })
}

export async function restoreDocument(id: string, ownerId: string) {
  const doc = await prisma.document.findFirst({ where: { id, ownerId, isDeleted: true } })
  if (!doc) throw new AppError(404, 'Document not found in trash')
  return prisma.document.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
    select: { id: true, title: true, updatedAt: true },
  })
}

export async function saveDocumentContent(id: string, ownerId: string, content: Buffer) {
  const doc = await prisma.document.findFirst({ where: { id, ownerId, isDeleted: false } })
  if (!doc) throw new AppError(404, 'Document not found')
  return prisma.document.update({
    where: { id },
    data: { content, updatedAt: new Date() },
    select: { id: true, updatedAt: true },
  })
}
