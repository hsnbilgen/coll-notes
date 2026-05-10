import { useEffect, useRef } from 'react'
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
  const ydocRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)

  useEffect(() => {
    const ydoc = new Y.Doc()
    const token = getToken()
    const wsUrl = import.meta.env.VITE_COLLAB_WS_URL ?? 'ws://localhost:3002'
    // @ts-ignore — y-websocket types may be incomplete
    const provider = new WebsocketProvider(wsUrl, documentId, ydoc, {
      params: { token: token || '', documentId },
    })
    // @ts-ignore
    const persistence = new IndexeddbPersistence(`coll-notes-${documentId}`, ydoc)

    // @ts-ignore
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: randomColor(),
    })

    ydocRef.current = ydoc
    providerRef.current = provider

    return () => {
      // @ts-ignore
      provider.disconnect()
      // @ts-ignore
      persistence.destroy()
      ydoc.destroy()
    }
  }, [documentId, userName])

  return { ydocRef, providerRef }
}