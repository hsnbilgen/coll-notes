import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Editor } from '@/components/editor/Editor'
import { useCurrentUser } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'

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
    setData(null)
    setError(null)
    api.get(`/share/${shareToken}`)
      .then((res) => {
        setData(res.data)
        api.post(`/share/${shareToken}/save`)
          .then(() => qc.invalidateQueries({ queryKey: ['shared-with-me'] }))
          .catch(() => {})
      })
      .catch(() => setError('This link is invalid or has expired.'))
  }, [shareToken, qc])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b flex items-center gap-3">
        <span className="font-semibold">{data.document.title || 'Untitled'}</span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded border">
          {data.permission === 'READ_ONLY' ? 'Read only' : 'Collaborative editing'}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          Viewing as {user?.email}
        </span>
      </div>
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
