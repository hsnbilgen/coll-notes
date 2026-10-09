import { History, X } from 'lucide-react'
import { useVersions } from '@/hooks/useVersions'
import { VersionItem } from './VersionItem'

interface Props {
  documentId: string
  onClose: () => void
  onRestored: () => void
}

export function VersionHistoryPanel({ documentId, onClose, onRestored }: Props) {
  const { data: versions, isLoading } = useVersions(documentId)

  return (
    <aside className="panel">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4 text-brand" /> Version history
        </h2>
        <button onClick={onClose} title="Close" className="btn-ghost h-7 w-7"><X className="h-4 w-4" /></button>
      </div>
      <p className="border-b px-4 py-2.5 text-xs text-muted-foreground">
        Snapshots are taken every 5 minutes. Press <span className="kbd">⌘S</span> to save one now.
      </p>
      <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
        {isLoading && <p className="px-2 py-3 text-sm text-muted-foreground">Loading…</p>}
        {versions?.map((v, i) => (
          <VersionItem
            key={v.id}
            id={v.id}
            documentId={documentId}
            createdAt={v.createdAt}
            isLatest={i === 0}
            onRestored={() => { onRestored(); onClose() }}
          />
        ))}
        {versions?.length === 0 && (
          <div className="px-4 py-10 text-center">
            <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No versions yet</p>
          </div>
        )}
      </div>
    </aside>
  )
}
