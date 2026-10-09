import { useState } from 'react'
import { RotateCcw, Trash2, X } from 'lucide-react'
import { useTrashDocuments, useRestoreDocument, useHardDeleteDocument } from '@/hooks/useDocuments'

const iconBtn = 'flex h-6 w-6 items-center justify-center rounded hover:bg-background'

export function TrashList() {
  const { data: docs } = useTrashDocuments()
  const restore = useRestoreDocument()
  const hardDelete = useHardDeleteDocument()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (!docs?.length) return <p className="px-3 py-2 text-xs text-muted-foreground">Trash is empty</p>

  return (
    <div className="flex flex-col gap-px">
      {docs.map((doc) => (
        <div key={doc.id} className="group flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent/60">
          <span className="flex-1 truncate line-through decoration-muted-foreground/40">{doc.title || 'Untitled'}</span>
          {confirmId === doc.id ? (
            <div className="flex shrink-0 items-center gap-0.5 animate-fade-in">
              <button
                onClick={() => { hardDelete.mutate(doc.id); setConfirmId(null) }}
                title="Confirm permanent delete"
                className="rounded bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground hover:opacity-90"
              >
                Delete
              </button>
              <button onClick={() => setConfirmId(null)} title="Cancel" className={iconBtn}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
              <button onClick={() => restore.mutate(doc.id)} title="Restore" className={`${iconBtn} hover:text-foreground`}>
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setConfirmId(doc.id)} title="Delete forever" className={`${iconBtn} hover:text-destructive`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
