import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { Extension } from '@tiptap/core'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { WebsocketProvider } from '@/types/y-websocket'
import { useCurrentUser } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { EditorToolbar } from './EditorToolbar'
import { PresenceAvatars } from './PresenceAvatars'
import { SlashCommands } from './SlashCommands'
import { useFocus } from '@/context/FocusContext'
import { cn } from '@/lib/utils'
import * as Y from 'yjs'
import { WebsocketProvider as WsProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import { getToken } from '@/lib/auth'

const USER_COLORS = ['#F44336', '#9C27B0', '#2196F3', '#4CAF50', '#FF9800', '#00BCD4']
function randomColor() { return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)] }

const CodeBlockExit = Extension.create({
  name: 'codeBlockExit',
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': ({ editor }) => {
        if (!editor.isActive('codeBlock')) return false
        return editor.chain().focus().exitCode().setNode('paragraph').run()
      },
    }
  },
})

interface Props {
  documentId: string
  readOnly?: boolean
  shareToken?: string
  guestName?: string
  onProviderReady?: (provider: WebsocketProvider) => void
}

export function Editor({ documentId, readOnly = false, shareToken, guestName, onProviderReady }: Props) {
  const user = useCurrentUser()
  const { isFocused } = useFocus()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const versionTimerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const [userColor] = useState(() => randomColor())
  const [ydoc] = useState(() => new Y.Doc())
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [syncState, setSyncState] = useState<'loading' | 'ready' | 'error'>('loading')

  // If logged in, always use their email. Only fall back to guestName if no JWT.
  const displayName = user?.email ?? guestName ?? 'Anonymous'
  const authToken = shareToken ?? getToken() ?? ''

  useEffect(() => () => { ydoc.destroy() }, [ydoc])

  useEffect(() => {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = import.meta.env.VITE_COLLAB_WS_URL ?? `${wsProto}//${window.location.host}/collab`
    const wp = new WsProvider(wsUrl, documentId, ydoc, {
      params: { token: authToken, documentId },
    }) as WebsocketProvider

    // Skip IndexedDB for share sessions — stale empty cache causes blank-on-load for guests
    const persistence = shareToken
      ? null
      : new IndexeddbPersistence(`coll-notes-${documentId}`, ydoc)

    setSyncState('loading') // eslint-disable-line react-hooks/set-state-in-effect
    const onSynced = (isSynced: boolean) => { if (isSynced !== false) setSyncState('ready') }
    wp.on('synced', onSynced)
    const onClose = () => setSyncState('error')
    wp.on('connection-close', onClose)

    wp.awareness.setLocalStateField('user', { name: displayName, color: userColor })
    setProvider(wp)
    if (onProviderReady) onProviderReady(wp)

    return () => {
      setProvider(null)
      wp.off('synced', onSynced)
      wp.off('connection-close', onClose)
      wp.disconnect()
      persistence?.destroy()
    }
  }, [documentId, authToken, shareToken, displayName, ydoc, userColor, onProviderReady])

  const saveDebounceMs = Number(import.meta.env.VITE_SAVE_DEBOUNCE_MS) || 500

  const debouncedSave = useCallback(() => {
    if (readOnly || shareToken) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const state = Y.encodeStateAsUpdate(ydoc)
      await api.patch(`/documents/${documentId}/content`, { content: Array.from(state) }).catch(() => {})
    }, saveDebounceMs)
  }, [documentId, ydoc, readOnly, shareToken, saveDebounceMs])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: ydoc }),
      ...(!readOnly && provider ? [CollaborationCursor.configure({
        provider,
        user: { name: displayName, color: userColor },
      })] : []),
      Placeholder.configure({ placeholder: "Start writing, or type '/' for commands…" }),
      Underline,
      SlashCommands,
      CodeBlockExit,
    ],
    editable: !readOnly,
    onUpdate: debouncedSave,
  }, [provider, debouncedSave])

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
      {!readOnly && !isFocused && (
        <div className="flex items-center border-b">
          <EditorToolbar editor={editor} />
          <PresenceAvatars provider={provider} />
        </div>
      )}
      <div className={cn('flex-1 overflow-y-auto relative', isFocused && 'flex justify-center')}>
        {shareToken && syncState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <span className="text-sm text-muted-foreground animate-pulse">Loading document…</span>
          </div>
        )}
        {shareToken && syncState === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <span className="text-sm text-muted-foreground">Could not connect to document. The link may have expired.</span>
          </div>
        )}
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
