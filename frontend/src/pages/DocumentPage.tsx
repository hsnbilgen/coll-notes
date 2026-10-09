import { useState, useCallback } from 'react'
import type { WebsocketProvider } from '@/types/y-websocket'
import { Editor } from '@/components/editor/Editor'
import { VersionHistoryPanel } from '@/components/versions/VersionHistoryPanel'
import { ShareDialog } from '@/components/sharing/ShareDialog'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { useDocuments, useRenameDocument } from '@/hooks/useDocuments'
import { Activity, History, Share2, Minimize2 } from 'lucide-react'
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
    <div className="relative flex h-full">
      <div className="flex flex-col flex-1 min-w-0">
        <header
          className={cn(
            'flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6',
            isFocused && 'hidden'
          )}
        >
          <TitleInput key={documentId} id={documentId} title={doc?.title ?? ''} />
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => { setShowActivity((v) => !v); setShowVersions(false) }}
              title="Activity"
              className={cn('btn-ghost h-8 px-2.5', showActivity && 'bg-accent text-foreground')}
            >
              <Activity className="h-4 w-4" /> <span className="hidden md:inline">Activity</span>
            </button>
            <button
              onClick={() => { setShowVersions((v) => !v); setShowActivity(false) }}
              title="Version history"
              className={cn('btn-ghost h-8 px-2.5', showVersions && 'bg-accent text-foreground')}
            >
              <History className="h-4 w-4" /> <span className="hidden md:inline">History</span>
            </button>
            <button onClick={() => setShowShare(true)} className="btn-brand ml-1 h-8 px-3.5">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>
        </header>

        {isFocused && (
          <button
            onClick={toggleFocus}
            className="btn-outline absolute right-4 top-4 z-10 h-8 px-3 text-xs text-muted-foreground shadow-sm animate-fade-in"
          >
            <Minimize2 className="h-3.5 w-3.5" /> Exit focus <span className="kbd">esc</span>
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


function TitleInput({ id, title }: { id: string; title: string }) {
  const [draft, setDraft] = useState(title)
  const [lastTitle, setLastTitle] = useState(title)
  const rename = useRenameDocument()

  // Pick up renames made elsewhere (sidebar) while not mid-edit
  if (title !== lastTitle) {
    setLastTitle(title)
    setDraft(title)
  }

  const commit = () => {
    const next = draft.trim()
    if (next && next !== title) rename.mutate({ id, title: next })
    else setDraft(title)
  }

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') { setDraft(title); e.currentTarget.blur() }
      }}
      placeholder="Untitled"
      aria-label="Document title"
      className="min-w-0 flex-1 truncate rounded-md bg-transparent px-2 py-1 -ml-2 font-serif text-xl tracking-tight outline-none transition hover:bg-accent/60 focus:bg-accent/60"
    />
  )
}
