import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { URL } from 'url'
import jwt from 'jsonwebtoken'
import * as Y from 'yjs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { setupWSConnection, setPersistence, docs } = require('y-websocket/bin/utils')
import { prisma } from '../lib/prisma'

async function authenticateConnection(req: IncomingMessage): Promise<boolean> {
  try {
    const url = new URL(req.url!, `http://localhost`)
    const token = url.searchParams.get('token')
    const documentId = url.searchParams.get('documentId')

    if (!documentId || !token) return false

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
      const doc = await prisma.document.findFirst({
        where: { id: documentId, ownerId: payload.id, isDeleted: false },
      })
      return !!doc
    } catch {
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

// Wire up Postgres as the y-websocket persistence layer.
// bindState: load saved Yjs binary from DB when a room first opens.
// writeState: save Yjs binary to DB when the last client disconnects.
setPersistence({
  bindState: async (docName: string, ydoc: Y.Doc) => {
    const row = await prisma.document.findUnique({
      where: { id: docName },
      select: { content: true },
    })
    if (row?.content && row.content.length > 0) {
      Y.applyUpdate(ydoc, row.content)
    }

    // Persist every update for this specific room — closure captures docName once
    let saveTimer: ReturnType<typeof setTimeout>
    const onUpdate = () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(async () => {
        const state = Y.encodeStateAsUpdate(ydoc)
        await prisma.document.updateMany({
          where: { id: docName },
          data: { content: new Uint8Array(state) },
        }).catch(() => {})
      }, 500)
    }
    ydoc.on('update', onUpdate)
    // Clean up timer when doc is destroyed
    ydoc.on('destroy', () => clearTimeout(saveTimer))
  },
  writeState: async (docName: string, ydoc: Y.Doc) => {
    // Final flush when last client leaves
    const state = Y.encodeStateAsUpdate(ydoc)
    await prisma.document.updateMany({
      where: { id: docName },
      data: { content: new Uint8Array(state) },
    }).catch(() => {})
  },
})

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

// Called after a version restore — evicts the in-memory room so the next
// connection reloads state from the DB (which now has the restored content).
export function evictRoom(documentId: string) {
  const doc = docs.get(documentId)
  if (doc) {
    doc.destroy()
    docs.delete(documentId)
  }
}
