import { useSharedWithMe } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'

interface Props {
  activeShareToken: string | null
  onSelect: (shareToken: string) => void
}

export function SharedWithMeList({ activeShareToken, onSelect }: Props) {
  const { data: items, isLoading } = useSharedWithMe()

  if (isLoading) return <p className="px-3 py-2 text-sm text-muted-foreground">Loading…</p>
  if (!items?.length) return <p className="px-3 py-2 text-sm text-muted-foreground">None yet</p>

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => (
        <button
          key={item.shareToken}
          onClick={() => onSelect(item.shareToken)}
          className={cn(
            'w-full text-left text-sm px-2 py-1 rounded truncate flex items-center gap-1.5',
            item.shareToken === activeShareToken
              ? 'bg-accent font-medium'
              : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="shrink-0 text-xs opacity-50">
            {item.permission === 'EDITABLE' ? '✎' : '👁'}
          </span>
          <span className="truncate">{item.document.title || 'Untitled'}</span>
        </button>
      ))}
    </div>
  )
}
