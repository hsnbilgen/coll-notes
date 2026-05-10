import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface ActivityEvent {
  type: 'created' | 'edited'
  timestamp: string
  label: string
}

interface AwarenessUser {
  name: string
  color: string
}

interface Props {
  documentId: string
  provider: any | null
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
      provider.awareness.getStates().forEach((state: any) => {
        if (state.user?.name) states.push(state.user)
      })
      setActiveUsers(states)
    }

    update()
    provider.awareness.on('change', update)
    return () => provider.awareness.off('change', update)
  }, [provider])

  return (
    <div className="w-72 border-l bg-background flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">Activity</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
      </div>

      {activeUsers.length > 0 && (
        <div className="px-4 py-3 border-b">
          <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Now viewing</p>
          <div className="flex flex-col gap-1.5">
            {activeUsers.map((u, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                  style={{ backgroundColor: u.color }}
                />
                <span className="text-sm truncate">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Recent edits</p>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {activity.map((event, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  event.type === 'created' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm">{event.label}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
