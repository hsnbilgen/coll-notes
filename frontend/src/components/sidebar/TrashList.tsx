import { useState } from 'react'
import { useTrashDocuments, useRestoreDocument, useHardDeleteDocument } from '@/hooks/useDocuments'

export function TrashList() {
  const { data: docs } = useTrashDocuments()
  const restore = useRestoreDocument()
  const hardDelete = useHardDeleteDocument()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (!docs?.length) return <p className="px-3 py-2 text-sm text-muted-foreground">Trash is empty</p>

  return (
    <div className="flex flex-col gap-0.5">
      {docs.map((doc) => (
        <div key={doc.id} className="group flex items-center justify-between px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded">
          <span className="truncate flex-1">{doc.title || 'Untitled'}</span>
          <div className="hidden group-hover:flex items-center gap-1 ml-2 shrink-0">
            <button
              onClick={() => restore.mutate(doc.id)}
              title="Restore"
              className="text-xs hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent"
            >
              Restore
            </button>
            {confirmId === doc.id ? (
              <>
                <button
                  onClick={() => { hardDelete.mutate(doc.id); setConfirmId(null) }}
                  title="Confirm permanent delete"
                  className="text-xs text-destructive hover:text-destructive px-1.5 py-0.5 rounded hover:bg-destructive/10 font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  title="Cancel"
                  className="text-xs hover:text-foreground px-1 py-0.5 rounded hover:bg-accent"
                >
                  ✕
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmId(doc.id)}
                title="Delete forever"
                className="text-xs hover:text-destructive px-1.5 py-0.5 rounded hover:bg-destructive/10"
              >
                <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
                  <path d="M5.5 1.5h4M1.5 4h12M6 7v4M9 7v4M2.5 4l1 9h8l1-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}