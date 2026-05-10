import 'dotenv/config'
import http from 'http'
import app from './app'
import { setupWebSocketServer } from './websocket/server'

const PORT = parseInt(process.env.PORT || '3001')
const WS_PORT = parseInt(process.env.WS_PORT || '3002')

const httpServer = http.createServer(app)
httpServer.listen(PORT, () => console.log(`HTTP server running on port ${PORT}`))

setupWebSocketServer(WS_PORT)
