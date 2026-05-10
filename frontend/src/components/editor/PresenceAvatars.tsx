import { useEffect, useState } from 'react'

interface PresenceUser {
  name: string
  color: string
  clientId: number
}

interface Props {
  provider: any | null
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
    return () => provider.awareness.off('change', update)
  }, [provider])

  if (!users.length) return null

  return (
    <div className="flex items-center gap-1 px-2">
      {users.map((u) => (
        <div
          key={u.clientId}
          title={u.name}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
          style={{ backgroundColor: u.color }}
        >
          {u.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  )
}