import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { listVersions, restoreVersion, createVersion } from '../services/version.service'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

const router = Router()

router.use(requireAuth)

router.get('/:id/versions', async (req: AuthRequest, res, next) => {
  try {
    const versions = await listVersions(req.params.id as string, req.user!.id)
    res.json(versions)
  } catch (err) { next(err) }
})

router.post('/:id/versions', async (req: AuthRequest, res, next) => {
  try {
    const { content } = z.object({ content: z.array(z.number()) }).parse(req.body)
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id as string, ownerId: req.user!.id, isDeleted: false }
    })
    if (!doc) return next(new AppError(404, 'Document not found'))
    const version = await createVersion(req.params.id as string, Buffer.from(content))
    res.status(201).json(version)
  } catch (err) { next(err) }
})

router.post('/:id/versions/:vid/restore', async (req: AuthRequest, res, next) => {
  try {
    const result = await restoreVersion(req.params.id as string, req.params.vid as string, req.user!.id)
    res.json(result)
  } catch (err) { next(err) }
})

export default router
