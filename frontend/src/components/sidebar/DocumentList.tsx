import { useDocuments } from '@/hooks/useDocuments'
import { DocumentItem } from './DocumentItem'

interface Props {
  activeId: string | null
  onSelect: (id: string) => void
}

export function DocumentList({ activeId, onSelect }: Props) {
  const { data: docs, isLoading } = useDocuments()

  if (isLoading) return <p className="px-3 py-2 text-sm text-muted-foreground">Loading…</p>
  if (!docs?.length) return <p className="px-3 py-2 text-sm text-muted-foreground">No documents yet</p>

  return (
    <div className="flex flex-col gap-0.5">
      {docs.map((doc) => (
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