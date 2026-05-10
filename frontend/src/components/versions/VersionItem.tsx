import { useRestoreVersion } from '@/hooks/useVersions'

interface Props {
  id: string
  documentId: string
  createdAt: string
  isLatest: boolean
}

export function VersionItem({ id, documentId, createdAt, isLatest }: Props) {
  const restore = useRestoreVersion(documentId)

  return (
    <div className="flex items-center justify-between px-3 py-2 text-sm border-b last:border-0">
      <div>
        <p className="font-medium">{new Date(createdAt).toLocaleString()}</p>
        {isLatest && <p className="text-xs text-muted-foreground">Current version</p>}
      </div>
      {!isLatest && (
        <button
          onClick={() => restore.mutate(id)}
          disabled={restore.isPending}
          className="text-xs px-2 py-1 rounded border hover:bg-accent disabled:opacity-50"
        >
          Restore
        </button>
      )}
    </div>
  )
}