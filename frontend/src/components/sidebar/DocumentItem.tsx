import { useState } from 'react'
import { useRenameDocument, useDeleteDocument } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'

interface Props {
  id: string
  title: string
  isActive: boolean
  onSelect: (id: string) => void
}

export function DocumentItem({ id, title, isActive, onSelect }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const rename = useRenameDocument()
  const del = useDeleteDocument()

  const commitRename = () => {
    if (draft.trim() && draft !== title) rename.mutate({ id, title: draft.trim() })
    setEditing(false)
  }

  return (
    <div
      className={cn(
        'group flex items-center justify-between px-3 py-1.5 rounded cursor-pointer text-sm',
        isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
      )}
      onClick={() => onSelect(id)}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => e.key === 'Enter' && commitRename()}
          className="flex-1 bg-transparent outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate">{title || 'Untitled'}</span>
      )}
      <div className="hidden group-hover:flex gap-1 ml-2">
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(title) }}
          className="text-muted-foreground hover:text-foreground text-xs px-1"
        >
          ✏️
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); del.mutate(id) }}
          className="text-muted-foreground hover:text-destructive text-xs px-1"
        >
          🗑
        </button>
      </div>
    </div>
  )
}