import { useState, useCallback } from 'react'
import type { WebsocketProvider } from '@/types/y-websocket'
import { Editor } from '@/components/editor/Editor'
import { VersionHistoryPanel } from '@/components/versions/VersionHistoryPanel'
import { ShareDialog } from '@/components/sharing/ShareDialog'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { useDocuments } from '@/hooks/useDocuments'
import { useFocus } from '@/context/FocusContext'
import { cn } from '@/lib/utils'

interface Props {
  documentId: string
}

export function DocumentPage({ documentId }: Props) {
  const [showVersions, setShowVersions] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const { data: docs } = useDocuments()
  const doc = docs?.find((d) => d.id === documentId)
  const { isFocused, toggleFocus } = useFocus()

  const handleProviderReady = useCallback((p: WebsocketProvider) => setProvider(p), [])
  const handleRestored = useCallback(() => setEditorKey((k) => k + 1), [])

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0">
        <div
          className={cn(
            'flex items-center justify-between px-6 py-3 border-b transition-all duration-200',
            isFocused && 'hidden'
          )}
        >
          <h1 className="font-semibold truncate">{doc?.title || 'Untitled'}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowActivity((v) => !v); setShowVersions(false) }}
              className={cn('text-sm px-3 py-1.5 rounded border hover:bg-accent', showActivity && 'bg-accent')}
            >
              Activity
            </button>
            <button
              onClick={() => { setShowVersions((v) => !v); setShowActivity(false) }}
              className={cn('text-sm px-3 py-1.5 rounded border hover:bg-accent', showVersions && 'bg-accent')}
            >
              History
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90"
            >
              Share
            </button>
          </div>
        </div>

        {isFocused && (
          <button
            onClick={toggleFocus}
            className="absolute top-3 right-3 z-10 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border bg-background/80 backdrop-blur-sm"
          >
            Exit focus · esc
          </button>
        )}

        <div className="flex-1 overflow-hidden">
          <Editor key={`${documentId}-${editorKey}`} documentId={documentId} onProviderReady={handleProviderReady} />
        </div>
      </div>

      {showActivity && (
        <ActivityFeed
          documentId={documentId}
          provider={provider}
          onClose={() => setShowActivity(false)}
        />
      )}
      {showVersions && (
        <VersionHistoryPanel
          documentId={documentId}
          onClose={() => setShowVersions(false)}
          onRestored={handleRestored}
        />
      )}
      {showShare && (
        <ShareDialog documentId={documentId} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}
