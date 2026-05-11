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

const v1 = express.Router()
v1.use('/auth', authRoutes)
v1.use('/documents', documentRoutes)
v1.use('/documents', versionRoutes)
v1.use('/', sharingRoutes)

app.use('/api/v1', v1)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use(errorHandler)

export default app
