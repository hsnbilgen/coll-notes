import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import {
  listDocuments,
  listDeletedDocuments,
  createDocument,
  renameDocument,
  softDeleteDocument,
  restoreDocument,
} from '../services/document.service'

const router = Router()

router.use(requireAuth)

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const docs = await listDocuments(req.user!.id)
    res.json(docs)
  } catch (err) { next(err) }
})

router.get('/trash', async (req: AuthRequest, res, next) => {
  try {
    const docs = await listDeletedDocuments(req.user!.id)
    res.json(docs)
  } catch (err) { next(err) }
})

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const doc = await createDocument(req.user!.id)
    res.status(201).json(doc)
  } catch (err) { next(err) }
})

router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { title } = z.object({ title: z.string().min(1) }).parse(req.body)
    const doc = await renameDocument(req.params.id as string, req.user!.id, title)
    res.json(doc)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await softDeleteDocument(req.params.id as string, req.user!.id)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

router.post('/:id/restore', async (req: AuthRequest, res, next) => {
  try {
    const doc = await restoreDocument(req.params.id as string, req.user!.id)
    res.json(doc)
  } catch (err) { next(err) }
})

export default router
