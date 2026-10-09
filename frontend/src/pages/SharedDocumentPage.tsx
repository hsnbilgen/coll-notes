import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Editor } from '@/components/editor/Editor'
import { getToken } from '@/lib/auth'
import { LogoMark } from '@/components/Logo'
import { PermissionBadge, ViewerChip, CenteredMessage } from '@/components/sharing/SharedHeader'

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

  if (error) return <div className="h-screen"><CenteredMessage error>{error}</CenteredMessage></div>
  if (!data) return <div className="h-screen"><CenteredMessage>Opening shared note…</CenteredMessage></div>

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
        <Link to="/login" title="Coll Notes"><LogoMark className="h-6 w-6" /></Link>
        <span className="h-5 w-px bg-border" />
        <h1 className="truncate font-serif text-xl tracking-tight">{data.document.title || 'Untitled'}</h1>
        <PermissionBadge permission={data.permission} />
        <ViewerChip name={name} />
        <Link to="/register" className="btn-primary hidden h-8 px-3 text-xs sm:inline-flex">Get your own workspace</Link>
      </header>
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
