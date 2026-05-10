import { useState, useEffect } from 'react'
import { useRenameDocument, useDeleteDocument, useDuplicateDocument } from '@/hooks/useDocuments'
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
  const duplicate = useDuplicateDocument()

  useEffect(() => {
    if (!editing) setDraft(title)
  }, [title, editing])

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
      <div className="hidden group-hover:flex items-center gap-0.5 ml-2 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(title) }}
          title="Rename"
          className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted"
        >
          <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
            <path d="M11.2 1.5a1.8 1.8 0 0 1 2.3 2.8L4.5 13.3H1.5v-3L11.2 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); duplicate.mutate(id) }}
          title="Duplicate"
          className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted"
        >
          <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
            <rect x="1.5" y="4.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M4.5 4.5V3a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 13.5 3v6a1.5 1.5 0 0 1-1.5 1.5H10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); del.mutate(id) }}
          title="Move to trash"
          className="text-muted-foreground hover:text-destructive p-0.5 rounded hover:bg-muted"
        >
          <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
            <path d="M5.5 1.5h4M1.5 4h12M6 7v4M9 7v4M2.5 4l1 9h8l1-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}