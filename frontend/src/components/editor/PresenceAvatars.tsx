import { useEffect, useState } from 'react'
import type { WebsocketProvider } from '@/types/y-websocket'

interface PresenceUser {
  name: string
  color: string
  clientId: number
}

interface Props {
  provider: WebsocketProvider | null
}

function initials(name: string) {
  const parts = name.split(/[@.\s]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function PresenceAvatars({ provider }: Props) {
  const [users, setUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    if (!provider) return

    const update = () => {
      const states = Array.from(provider.awareness.getStates().entries())
      const others = states
        .filter(([clientId]) => clientId !== provider.awareness.clientID)
        .map(([clientId, state]) => {
          const s = state as Record<string, { name?: string; color?: string }>
          return {
            clientId,
            name: s.user?.name || 'Anonymous',
            color: s.user?.color || '#888',
          }
        })
      setUsers(others)
    }

    provider.awareness.on('change', update)
    update()
    return () => provider.awareness.off('change', update)
  }, [provider])

  if (!users.length) return null

  const visible = users.slice(0, 5)
  const overflow = users.length - 5

  return (
    <div className="flex shrink-0 items-center pl-1">
      <div className="flex items-center" style={{ direction: 'rtl' }}>
        {overflow > 0 && (
          <div
            className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground -ml-2 first:ml-0"
            style={{ direction: 'ltr' }}
          >
            +{overflow}
          </div>
        )}
        {[...visible].reverse().map((u) => (
          <div key={u.clientId} className="relative group -ml-2 first:ml-0">
            <div
              className="w-7 h-7 rounded-full border-2 border-background shadow-sm transition-transform hover:-translate-y-0.5 hover:z-10 flex items-center justify-center text-white text-[10px] font-semibold cursor-default select-none"
              style={{ backgroundColor: u.color, direction: 'ltr' }}
            >
              {initials(u.name)}
            </div>
            {/* Tooltip — shown below the avatar since toolbar sits at top of page */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-foreground text-background text-xs font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-foreground" />
              {u.name}
            </div>
          </div>
        ))}
      </div>

      {/* Live indicator */}
      <div className="ml-2 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{users.length} live</span>
      </div>
    </div>
  )
}
