import { useEffect, useState } from 'react'

interface PresenceUser {
  name: string
  color: string
  clientId: number
}

interface Props {
  provider: any | null
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
      const states = Array.from(provider.awareness.getStates().entries()) as [number, any][]
      const others = states
        .filter(([clientId]) => clientId !== provider.awareness.clientID)
        .map(([clientId, state]) => ({
          clientId,
          name: state.user?.name || 'Anonymous',
          color: state.user?.color || '#888',
        }))
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
    <div className="flex items-center pr-3">
      <div className="flex items-center" style={{ direction: 'rtl' }}>
        {overflow > 0 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground -ml-2 first:ml-0"
            style={{ direction: 'ltr' }}
          >
            +{overflow}
          </div>
        )}
        {[...visible].reverse().map((u) => (
          <div key={u.clientId} className="relative group -ml-2 first:ml-0">
            <div
              className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-semibold cursor-default select-none"
              style={{ backgroundColor: u.color, direction: 'ltr' }}
            >
              {initials(u.name)}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {u.name}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
            </div>
          </div>
        ))}
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1 ml-2 pl-2 border-l">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">{users.length} live</span>
      </div>
    </div>
  )
}
