import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { createShare, resolveShare } from '../services/share.service'
import { SharePermission } from '@prisma/client'

const router = Router()

router.post('/documents/:id/share', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { permission, expiresAt } = z.object({
      permission: z.enum(['READ_ONLY', 'EDITABLE']).default('READ_ONLY'),
      expiresAt: z.string().datetime().optional(),
    }).parse(req.body)

    const result = await createShare(
      req.params.id,
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

export default router
