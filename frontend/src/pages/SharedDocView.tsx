import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Editor } from '@/components/editor/Editor'
import { useCurrentUser } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { PermissionBadge, ViewerChip, CenteredMessage } from '@/components/sharing/SharedHeader'

interface ShareData {
  document: { id: string; title: string }
  permission: 'READ_ONLY' | 'EDITABLE'
}

interface Props {
  shareToken: string
}

export function SharedDocView({ shareToken }: Props) {
  const user = useCurrentUser()
  const qc = useQueryClient()
  const [data, setData] = useState<ShareData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.get(`/share/${shareToken}`)
      .then((res) => {
        if (cancelled) return
        setData(res.data)
        api.post(`/share/${shareToken}/save`)
          .then(() => qc.invalidateQueries({ queryKey: ['shared-with-me'] }))
          .catch(() => {})
      })
      .catch(() => { if (!cancelled) setError('This link is invalid or has expired.') })
    return () => { cancelled = true }
  }, [shareToken, qc])

  if (error) return <CenteredMessage error>{error}</CenteredMessage>
  if (!data) return <CenteredMessage>Opening shared note…</CenteredMessage>

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
        <h1 className="truncate font-serif text-xl tracking-tight">{data.document.title || 'Untitled'}</h1>
        <PermissionBadge permission={data.permission} />
        <ViewerChip name={user?.email ?? ''} />
      </header>
      <div className="flex-1 overflow-hidden">
        <Editor
          documentId={data.document.id}
          readOnly={data.permission === 'READ_ONLY'}
          shareToken={shareToken}
        />
      </div>
    </div>
  )
}
