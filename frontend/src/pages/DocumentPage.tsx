import { useState } from 'react'
import { Editor } from '@/components/editor/Editor'
import { VersionHistoryPanel } from '@/components/versions/VersionHistoryPanel'
import { ShareDialog } from '@/components/sharing/ShareDialog'
import { useDocuments } from '@/hooks/useDocuments'

interface Props {
  documentId: string
}

export function DocumentPage({ documentId }: Props) {
  const [showVersions, setShowVersions] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const { data: docs } = useDocuments()
  const doc = docs?.find((d) => d.id === documentId)

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <h1 className="font-semibold truncate">{doc?.title || 'Untitled'}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowVersions((v) => !v)}
              className="text-sm px-3 py-1.5 rounded border hover:bg-accent"
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
        <div className="flex-1 overflow-hidden">
          <Editor documentId={documentId} />
        </div>
      </div>

      {showVersions && (
        <VersionHistoryPanel documentId={documentId} onClose={() => setShowVersions(false)} />
      )}
      {showShare && (
        <ShareDialog documentId={documentId} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}