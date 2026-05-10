import 'dotenv/config'
import http from 'http'
import app from './app'
import { setupWebSocketServer } from './websocket/server'

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set')
  process.exit(1)
}

const PORT = parseInt(process.env.PORT || '3001')
const WS_PORT = parseInt(process.env.WS_PORT || '3002')

const httpServer = http.createServer(app)
httpServer.listen(PORT, () => console.log(`HTTP server running on port ${PORT}`))

setupWebSocketServer(WS_PORT)
