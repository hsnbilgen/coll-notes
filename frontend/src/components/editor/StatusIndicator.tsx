import { Check, CloudOff, Loader2, Bookmark } from 'lucide-react'

interface Props {
  connected: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'version'
}

export function StatusIndicator({ connected, saveStatus }: Props) {
  if (!connected) {
    return (
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400" title="Edits are kept on this device and sync when you reconnect">
        <CloudOff className="h-3.5 w-3.5" /> Offline
      </span>
    )
  }

  const content = {
    idle: null,
    saving: <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving</>,
    saved: <><Check className="h-3.5 w-3.5" /> Saved</>,
    version: <><Bookmark className="h-3.5 w-3.5 text-brand" /> Version saved</>,
  }[saveStatus]

  return (
    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground animate-fade-in" key={saveStatus}>
      {content}
    </span>
  )
}
