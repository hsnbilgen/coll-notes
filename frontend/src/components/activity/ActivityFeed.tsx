import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { WebsocketProvider } from '@/types/y-websocket'
import { Activity, X } from 'lucide-react'

type ActivityType = 'created' | 'renamed' | 'edited' | 'version_saved' | 'version_restored' | 'shared' | 'collaborator_joined'

interface ActivityEvent {
  type: ActivityType
  timestamp: string
  label: string
}

interface AwarenessUser {
  name: string
  color: string
}

interface Props {
  documentId: string
  provider: WebsocketProvider | null
  onClose: () => void
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function dotColor(type: ActivityType) {
  switch (type) {
    case 'created': return 'bg-green-500'
    case 'renamed': return 'bg-yellow-500'
    case 'version_saved': return 'bg-indigo-500'
    case 'version_restored': return 'bg-orange-500'
    case 'shared': return 'bg-purple-500'
    case 'collaborator_joined': return 'bg-pink-500'
    default: return 'bg-blue-500'
  }
}

export function ActivityFeed({ documentId, provider, onClose }: Props) {
  const [activeUsers, setActiveUsers] = useState<AwarenessUser[]>([])

  const { data: activity = [] } = useQuery<ActivityEvent[]>({
    queryKey: ['activity', documentId],
    queryFn: () => api.get(`/documents/${documentId}/activity`).then((r) => r.data),
    refetchInterval: 15000,
  })

  useEffect(() => {
    if (!provider) return

    const update = () => {
      const states: AwarenessUser[] = []
      provider.awareness.getStates().forEach((state) => {
        const s = state as Record<string, { name?: string; color?: string }>
        if (s.user?.name) states.push(s.user as AwarenessUser)
      })
      setActiveUsers(states)
    }

    update()
    provider.awareness.on('change', update)
    return () => provider.awareness.off('change', update)
  }, [provider])

  return (
    <aside className="panel">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4 text-brand" /> Activity
        </h2>
        <button onClick={onClose} title="Close" className="btn-ghost h-7 w-7"><X className="h-4 w-4" /></button>
      </div>

      {activeUsers.length > 0 && (
        <div className="border-b px-4 py-4">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">In this note now</p>
          <div className="flex flex-col gap-2">
            {activeUsers.map((u, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ backgroundColor: u.color }}
                >
                  {u.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="truncate text-sm">{u.name}</span>
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Timeline</p>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <ol className="relative ml-1 border-l">
            {activity.map((event, i) => (
              <li key={i} className="relative pb-4 pl-5 last:pb-0">
                <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card ${dotColor(event.type)}`} />
                <p className="text-sm leading-snug">{event.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(event.timestamp)}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  )
}
