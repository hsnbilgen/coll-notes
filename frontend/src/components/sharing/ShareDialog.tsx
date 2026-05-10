import { useState, useRef } from 'react'
import { api } from '@/lib/api'

interface Props {
  documentId: string
  onClose: () => void
}

export function ShareDialog({ documentId, onClose }: Props) {
  const [permission, setPermission] = useState<'READ_ONLY' | 'EDITABLE'>('READ_ONLY')
  const [link, setLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const generate = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/documents/${documentId}/share`, { permission })
      setLink(res.data.url)
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link).catch(() => {})
    setCopied(true)
    clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Share document</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['READ_ONLY', 'EDITABLE'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPermission(p)}
              className={`px-3 py-1.5 rounded text-sm border ${permission === p ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
            >
              {p === 'READ_ONLY' ? 'Read only' : 'Can edit'}
            </button>
          ))}
        </div>

        {!link ? (
          <button
            onClick={generate}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate link'}
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 border rounded px-3 py-2 text-sm bg-muted"
            />
            <button
              onClick={copy}
              className="px-3 py-2 rounded border text-sm hover:bg-accent"
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}