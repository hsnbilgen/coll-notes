import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Editor } from '@/components/editor/Editor'
import { getToken } from '@/lib/auth'

interface ShareData {
  document: { id: string; title: string }
  permission: 'READ_ONLY' | 'EDITABLE'
}

function guestName() {
  const stored = sessionStorage.getItem('guest-name')
  if (stored) return stored
  const n = `Guest ${Math.floor(Math.random() * 9000) + 1000}`
  sessionStorage.setItem('guest-name', n)
  return n
}

export function SharedDocumentPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<ShareData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [name] = useState(() => guestName())

  useEffect(() => {
    if (getToken()) {
      navigate(`/shared/${token}`, { replace: true })
      return
    }
    api.get(`/share/${token}`)
      .then((res) => setData(res.data))
      .catch(() => setError('This link is invalid or has expired.'))
  }, [token, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        {error}
      </div>
    )
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 py-3 border-b flex items-center gap-3">
        <span className="font-semibold">{data.document.title}</span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded border">
          {data.permission === 'READ_ONLY' ? 'Read only' : 'Collaborative editing'}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">Viewing as {name}</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          documentId={data.document.id}
          readOnly={data.permission === 'READ_ONLY'}
          shareToken={token}
          guestName={name}
        />
      </div>
    </div>
  )
}
