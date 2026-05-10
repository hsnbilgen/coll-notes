import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  if (err instanceof ZodError) {
    res.status(422).json({ error: 'Validation error', details: err.errors })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
