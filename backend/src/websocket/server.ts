import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { URL } from 'url'
import jwt from 'jsonwebtoken'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { setupWSConnection } = require('y-websocket/bin/utils')
import { prisma } from '../lib/prisma'

async function authenticateConnection(req: IncomingMessage): Promise<boolean> {
  try {
    const url = new URL(req.url!, `http://localhost`)
    const token = url.searchParams.get('token')
    const documentId = url.searchParams.get('documentId')

    if (!documentId || !token) return false

    // Try JWT first (authenticated user)
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
      const doc = await prisma.document.findFirst({
        where: { id: documentId, ownerId: payload.id, isDeleted: false },
      })
      return !!doc
    } catch {
      // Try share token (public editable share)
      const share = await prisma.documentShare.findUnique({
        where: { token },
        include: { document: { select: { id: true, isDeleted: true } } },
      })
      if (!share || share.document.isDeleted) return false
      if (share.document.id !== documentId) return false
      if (share.expiresAt && share.expiresAt < new Date()) return false
      return share.permission === 'EDITABLE'
    }
  } catch {
    return false
  }
}

export function setupWebSocketServer(port: number) {
  const wss = new WebSocketServer({ port })

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const authorized = await authenticateConnection(req)
    if (!authorized) {
      ws.close(4001, 'Unauthorized')
      return
    }
    setupWSConnection(ws as any, req)
  })

  console.log(`WebSocket server running on port ${port}`)
  return wss
}
