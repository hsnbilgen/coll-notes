import { Router } from 'express'
import { z } from 'zod'
import { registerUser, loginUser } from '../services/auth.service'
import { log } from '../lib/logger'

const router = Router()

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/register', async (req, res, next) => {
  const ip = req.ip
  let email = '?'
  try {
    const body = RegisterSchema.parse(req.body)
    email = body.email
    const result = await registerUser(body.email, body.password, body.name)
    log.auth('register_ok', { email, ip })
    res.status(201).json(result)
  } catch (err) {
    const reason = (err as { message?: string })?.message ?? 'unknown'
    log.auth('register_fail', { email, ip, reason })
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  const ip = req.ip
  let email = '?'
  try {
    const body = LoginSchema.parse(req.body)
    email = body.email
    const result = await loginUser(body.email, body.password)
    log.auth('login_ok', { email, ip })
    res.json(result)
  } catch (err) {
    const reason = (err as { message?: string })?.message ?? 'unknown'
    log.auth('login_fail', { email, ip, reason })
    next(err)
  }
})

export default router
