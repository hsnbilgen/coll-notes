import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { URL } from 'url'
import jwt from 'jsonwebtoken'
import * as Y from 'yjs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { setupWSConnection, setPersistence, docs } = require('y-websocket/bin/utils')
import { prisma } from '../lib/prisma'
import { log } from '../lib/logger'

type AuthResult =
  | { ok: true; documentId: string; identity: string; via: 'jwt' | 'share' }
  | { ok: false; reason: string; documentId?: string }

// Best-effort real client IP from the upgrade request. Behind nginx/Traefik,
// the real IP arrives in X-Forwarded-For (first hop). Fall back to the
// socket peer if no header is set.
function clientIp(req: IncomingMessage): string {
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0].trim()
  if (Array.isArray(xff) && xff.length > 0) return xff[0].split(',')[0].trim()
  return req.socket.remoteAddress || '?'
}

async function authenticateConnection(req: IncomingMessage): Promise<AuthResult> {
  try {
    const url = new URL(req.url!, `http://localhost`)
    const token = url.searchParams.get('token')
    const documentId = url.searchParams.get('documentId')

    if (!documentId) return { ok: false, reason: 'no_document_id' }
    if (!token) return { ok: false, reason: 'no_token', documentId }

    // Try JWT owner auth first
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string
        email?: string
      }
      const doc = await prisma.document.findFirst({
        where: { id: documentId, ownerId: payload.id, isDeleted: false },
      })
      if (!doc) return { ok: false, reason: 'doc_not_owned', documentId }
      return {
        ok: true,
        documentId,
        identity: payload.email ?? payload.id,
        via: 'jwt',
      }
    } catch {
      // Fall through to share token check
    }

    // Share token — allow both READ_ONLY and EDITABLE to connect
    // READ_ONLY enforcement happens on the frontend (editor readOnly prop)
    const share = await prisma.documentShare.findUnique({
      where: { token },
      include: { document: { select: { id: true, isDeleted: true } } },
    })
    if (!share || share.document.isDeleted) {
      return { ok: false, reason: 'share_invalid', documentId }
    }
    if (share.document.id !== documentId) {
      return { ok: false, reason: 'share_doc_mismatch', documentId }
    }
    if (share.expiresAt && share.expiresAt < new Date()) {
      return { ok: false, reason: 'share_expired', documentId }
    }
    return {
      ok: true,
      documentId,
      identity: `share:${share.permission.toLowerCase()}`,
      via: 'share',
    }
  } catch {
    return { ok: false, reason: 'auth_exception' }
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
    const ip = clientIp(req)
    const result = await authenticateConnection(req)
    if (!result.ok) {
      log.ws('connect_denied', { ip, reason: result.reason, docId: result.documentId })
      ws.close(4001, 'Unauthorized')
      return
    }
    log.ws('connect_ok', {
      ip,
      docId: result.documentId,
      identity: result.identity,
      via: result.via,
    })
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
