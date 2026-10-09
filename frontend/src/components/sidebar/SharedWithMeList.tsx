import { Eye, PenLine } from 'lucide-react'
import { useSharedWithMe } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'

interface Props {
  activeShareToken: string | null
  onSelect: (shareToken: string) => void
  query?: string
}

export function SharedWithMeList({ activeShareToken, onSelect, query = '' }: Props) {
  const { data: items, isLoading } = useSharedWithMe()

  if (isLoading) return <div className="mx-2 h-6 w-2/3 animate-pulse rounded bg-accent" />
  if (!items?.length) return <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">Notes others share with you will show up here.</p>

  const q = query.trim().toLowerCase()
  const visible = q ? items.filter((i) => (i.document.title || 'Untitled').toLowerCase().includes(q)) : items
  if (!visible.length) return null

  return (
    <div className="flex flex-col gap-px">
      {visible.map((item) => {
        const active = item.shareToken === activeShareToken
        const Icon = item.permission === 'EDITABLE' ? PenLine : Eye
        return (
          <button
            key={item.shareToken}
            onClick={() => onSelect(item.shareToken)}
            title={item.permission === 'EDITABLE' ? 'Can edit' : 'View only'}
            className={cn(
              'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors',
              active ? 'bg-accent font-medium' : 'text-foreground/80 hover:bg-accent/60 hover:text-foreground'
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-brand' : 'text-muted-foreground')} />
            <span className="truncate">{item.document.title || 'Untitled'}</span>
          </button>
        )
      })}
    </div>
  )
}
