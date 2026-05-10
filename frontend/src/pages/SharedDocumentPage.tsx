import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Editor } from '@/components/editor/Editor'

interface ShareData {
  document: { id: string; title: string }
  permission: 'READ_ONLY' | 'EDITABLE'
}

export function SharedDocumentPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<ShareData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios.get(`/api/share/${token}`)
      .then((res) => setData(res.data))
      .catch(() => setError('This link is invalid or has expired.'))
  }, [token])

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
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          documentId={data.document.id}
          readOnly={data.permission === 'READ_ONLY'}
        />
      </div>
    </div>
  )
}