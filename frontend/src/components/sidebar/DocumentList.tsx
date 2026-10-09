import { useDocuments } from '@/hooks/useDocuments'
import { DocumentItem } from './DocumentItem'

interface Props {
  activeId: string | null
  onSelect: (id: string) => void
  query?: string
}

export function DocumentList({ activeId, onSelect, query = '' }: Props) {
  const { data: docs, isLoading } = useDocuments()

  if (isLoading) {
    return (
      <div className="space-y-1.5 px-2 py-1">
        {[70, 55, 80].map((w) => (
          <div key={w} className="h-6 animate-pulse rounded bg-accent" style={{ width: `${w}%` }} />
        ))}
      </div>
    )
  }
  if (!docs?.length) return <p className="px-3 py-2 text-sm text-muted-foreground">No notes yet — create your first one.</p>

  const q = query.trim().toLowerCase()
  const visible = q ? docs.filter((d) => (d.title || 'Untitled').toLowerCase().includes(q)) : docs
  if (!visible.length) return <p className="px-3 py-2 text-sm text-muted-foreground">No matches for “{query}”</p>

  return (
    <div className="flex flex-col gap-px">
      {visible.map((doc) => (
        <DocumentItem
          key={doc.id}
          id={doc.id}
          title={doc.title}
          isActive={doc.id === activeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
