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
    <div className="w-72 border-l bg-background flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">Version History</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <p className="px-4 py-3 text-sm text-muted-foreground">Loading…</p>}
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
          <p className="px-4 py-3 text-sm text-muted-foreground">No versions yet. Auto-saved every 5 minutes.</p>
        )}
      </div>
    </div>
  )
}
