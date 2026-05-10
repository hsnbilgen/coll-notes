import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useCurrentUser } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { EditorToolbar } from './EditorToolbar'
import { PresenceAvatars } from './PresenceAvatars'
import { SlashCommands } from './SlashCommands'
import { useFocus } from '@/context/FocusContext'
import { cn } from '@/lib/utils'
import * as Y from 'yjs'
// @ts-ignore
import { WebsocketProvider } from 'y-websocket'
// @ts-ignore
import { IndexeddbPersistence } from 'y-indexeddb'
import { getToken } from '@/lib/auth'

const USER_COLORS = ['#F44336', '#9C27B0', '#2196F3', '#4CAF50', '#FF9800', '#00BCD4']
function randomColor() { return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)] }

interface Props {
  documentId: string
  readOnly?: boolean
}

export function Editor({ documentId, readOnly = false }: Props) {
  const user = useCurrentUser()
  const { isFocused } = useFocus()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const versionTimerRef = useRef<ReturnType<typeof setInterval>>()
  const [ydoc] = useState(() => new Y.Doc())
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)

  useEffect(() => {
    const token = getToken()
    const wsUrl = import.meta.env.VITE_COLLAB_WS_URL ?? 'ws://localhost:3002'
    // @ts-ignore
    const wp = new WebsocketProvider(wsUrl, documentId, ydoc, {
      params: { token: token || '', documentId },
    })
    // @ts-ignore
    const persistence = new IndexeddbPersistence(`coll-notes-${documentId}`, ydoc)
    // @ts-ignore
    wp.awareness.setLocalStateField('user', { name: user?.email || 'Anonymous', color: randomColor() })
    setProvider(wp)

    return () => {
      // @ts-ignore
      wp.disconnect()
      // @ts-ignore
      persistence.destroy()
    }
  }, [documentId, user?.email, ydoc])

  const debouncedSave = useCallback(() => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const state = Y.encodeStateAsUpdate(ydoc)
      await api.patch(`/documents/${documentId}`, { content: Array.from(state) }).catch(() => {})
    }, 1500)
  }, [documentId, ydoc])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: ydoc }),
      ...(provider ? [CollaborationCursor.configure({
        provider,
        user: { name: user?.email || 'Anonymous', color: '#2196F3' },
      })] : []),
      Placeholder.configure({ placeholder: "Start writing, or type '/' for commands…" }),
      SlashCommands,
    ],
    editable: !readOnly,
    onUpdate: debouncedSave,
  }, [provider])

  useEffect(() => {
    versionTimerRef.current = setInterval(async () => {
      const state = Y.encodeStateAsUpdate(ydoc)
      await api.post(`/documents/${documentId}/versions`, {
        content: Array.from(state),
      }).catch(() => {})
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(versionTimerRef.current)
      clearTimeout(saveTimerRef.current)
    }
  }, [documentId, ydoc])

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className="flex items-center border-b">
          <EditorToolbar editor={editor} />
          <PresenceAvatars provider={provider} />
        </div>
      )}
      <div className={cn('flex-1 overflow-y-auto', isFocused && 'flex justify-center')}>
        <EditorContent
          editor={editor}
          className={cn(
            'prose prose-sm max-w-none p-8 min-h-full focus:outline-none',
            isFocused && 'max-w-[680px] w-full'
          )}
        />
      </div>
    </div>
  )
}