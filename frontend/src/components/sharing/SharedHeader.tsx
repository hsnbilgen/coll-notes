import { Eye, PenLine, Link2Off } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PermissionBadge({ permission }: { permission: 'READ_ONLY' | 'EDITABLE' }) {
  const editable = permission === 'EDITABLE'
  const Icon = editable ? PenLine : Eye
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        editable ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-accent text-muted-foreground'
      )}
    >
      <Icon className="h-3 w-3" /> {editable ? 'Can edit' : 'View only'}
    </span>
  )
}

export function ViewerChip({ name }: { name: string }) {
  return (
    <span className="ml-auto flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-amber-400 text-[10px] font-semibold text-white">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="hidden truncate sm:inline">{name}</span>
    </span>
  )
}

export function CenteredMessage({ error, children }: { error?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-center animate-fade-in">
      {error ? (
        <Link2Off className="h-8 w-8 text-muted-foreground/50" />
      ) : (
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
      )}
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}
