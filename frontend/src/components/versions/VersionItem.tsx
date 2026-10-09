import { useRestoreVersion } from '@/hooks/useVersions'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  id: string
  documentId: string
  createdAt: string
  isLatest: boolean
  onRestored: () => void
}

export function VersionItem({ id, documentId, createdAt, isLatest, onRestored }: Props) {
  const restore = useRestoreVersion(documentId, onRestored)
  const date = new Date(createdAt)

  return (
    <div className={cn('group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm', isLatest ? 'bg-brand-soft' : 'hover:bg-accent/60')}>
      <div className="min-w-0">
        <p className="font-medium">
          {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          <span className="ml-1.5 font-normal text-muted-foreground">
            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </p>
        {isLatest && <p className="text-xs font-medium text-brand">Latest snapshot</p>}
      </div>
      {!isLatest && (
        <button
          onClick={() => restore.mutate(id)}
          disabled={restore.isPending}
          className="btn-outline h-7 px-2.5 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
        >
          <RotateCcw className="h-3 w-3" />
          {restore.isPending ? 'Restoring…' : 'Restore'}
        </button>
      )}
    </div>
  )
}
