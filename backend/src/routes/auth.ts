import { Router } from 'express'
import { z } from 'zod'
import { registerUser, loginUser } from '../services/auth.service'

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
  try {
    const body = RegisterSchema.parse(req.body)
    const result = await registerUser(body.email, body.password, body.name)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body)
    const result = await loginUser(body.email, body.password)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
