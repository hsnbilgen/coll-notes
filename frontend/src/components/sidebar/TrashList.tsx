import { useTrashDocuments, useRestoreDocument } from '@/hooks/useDocuments'

export function TrashList() {
  const { data: docs } = useTrashDocuments()
  const restore = useRestoreDocument()

  if (!docs?.length) return <p className="px-3 py-2 text-sm text-muted-foreground">Trash is empty</p>

  return (
    <div className="flex flex-col gap-0.5">
      {docs.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between px-3 py-1.5 text-sm text-muted-foreground">
          <span className="truncate flex-1">{doc.title || 'Untitled'}</span>
          <button
            onClick={() => restore.mutate(doc.id)}
            className="text-xs ml-2 hover:text-foreground"
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  )
}