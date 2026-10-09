import { useState } from 'react'
import { Copy, FileText, Pencil, Trash2 } from 'lucide-react'
import { useRenameDocument, useDeleteDocument, useDuplicateDocument } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'

interface Props {
  id: string
  title: string
  isActive: boolean
  onSelect: (id: string) => void
}

const actionBtn = 'flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground'

export function DocumentItem({ id, title, isActive, onSelect }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const rename = useRenameDocument()
  const del = useDeleteDocument()
  const duplicate = useDuplicateDocument()

  const commitRename = () => {
    if (draft.trim() && draft !== title) rename.mutate({ id, title: draft.trim() })
    setEditing(false)
  }

  return (
    <div
      className={cn(
        'group relative flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm transition-colors',
        isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-foreground/80 hover:bg-accent/60 hover:text-foreground'
      )}
      onClick={() => onSelect(id)}
    >
      {isActive && <span className="absolute -left-2 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand" />}
      <FileText className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-muted-foreground')} />
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="min-w-0 flex-1 rounded bg-card px-1 outline-none ring-2 ring-brand/30"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate">{title || 'Untitled'}</span>
      )}
      <div className="ml-1 hidden shrink-0 items-center group-hover:flex">
        <button onClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(title) }} title="Rename" className={actionBtn}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); duplicate.mutate(id) }} title="Duplicate" className={actionBtn}>
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); del.mutate(id) }} title="Move to trash" className={cn(actionBtn, 'hover:text-destructive')}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
