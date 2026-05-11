import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { createShare, resolveShare, saveShareForUser, getSavedSharesForUser } from '../services/share.service'
import { SharePermission } from '@prisma/client'

const router = Router()

router.post('/documents/:id/share', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { permission, expiresAt } = z.object({
      permission: z.enum(['READ_ONLY', 'EDITABLE']).default('READ_ONLY'),
      expiresAt: z.string().datetime().optional(),
    }).parse(req.body)

    const result = await createShare(
      req.params.id as string,
      req.user!.id,
      permission as SharePermission,
      expiresAt ? new Date(expiresAt) : undefined
    )
    res.status(201).json(result)
  } catch (err) { next(err) }
})

router.get('/share/:token', async (req, res, next) => {
  try {
    const result = await resolveShare(req.params.token)
    res.json(result)
  } catch (err) { next(err) }
})

router.post('/share/:token/save', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await saveShareForUser(req.params.token as string, req.user!.id)
    res.status(204).end()
  } catch (err) { next(err) }
})

router.get('/shared-with-me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const items = await getSavedSharesForUser(req.user!.id)
    res.json(items)
  } catch (err) { next(err) }
})

export default router
