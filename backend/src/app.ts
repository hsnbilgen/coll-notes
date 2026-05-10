import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import documentRoutes from './routes/documents'
import versionRoutes from './routes/versions'
import sharingRoutes from './routes/sharing'

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/documents', versionRoutes)
app.use('/api', sharingRoutes)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use(errorHandler)

export default app
