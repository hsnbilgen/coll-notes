import { useEffect, useMemo } from 'react'
import * as Y from 'yjs'
// @ts-ignore
import { WebsocketProvider } from 'y-websocket'
// @ts-ignore
import { IndexeddbPersistence } from 'y-indexeddb'
import { getToken } from '@/lib/auth'

const USER_COLORS = ['#F44336', '#9C27B0', '#2196F3', '#4CAF50', '#FF9800', '#00BCD4']

function randomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

export function useCollabEditor(documentId: string, userName: string) {
  const ydoc = useMemo(() => new Y.Doc(), [documentId])

  const provider = useMemo(() => {
    const token = getToken()
    const wsUrl = `ws://localhost:3002`
    return new WebsocketProvider(wsUrl, documentId, ydoc, {
      params: { token: token || '', documentId },
    })
  }, [documentId, ydoc])

  const persistence = useMemo(
    () => new IndexeddbPersistence(`coll-notes-${documentId}`, ydoc),
    [documentId, ydoc]
  )

  useEffect(() => {
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: randomColor(),
    })

    return () => {
      provider.disconnect()
      persistence.destroy()
      ydoc.destroy()
    }
  }, [provider, persistence, ydoc, userName])

  return { ydoc, provider }
}