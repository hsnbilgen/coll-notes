import { useState, useRef, useEffect } from 'react'
import { Check, Copy, Eye, Link2, Loader2, PenLine, X } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Props {
  documentId: string
  onClose: () => void
}

const OPTIONS = [
  { value: 'READ_ONLY', icon: Eye, label: 'Can view', body: 'Read the note and watch edits live.' },
  { value: 'EDITABLE', icon: PenLine, label: 'Can edit', body: 'Write alongside you — no account needed.' },
] as const

export function ShareDialog({ documentId, onClose }: Props) {
  const [permission, setPermission] = useState<'READ_ONLY' | 'EDITABLE'>('READ_ONLY')
  const [link, setLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(copyTimerRef.current)
    }
  }, [onClose])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="w-full max-w-md rounded-2xl border bg-popover p-6 shadow-2xl animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 id="share-title" className="font-semibold">Share this note</h2>
              <p className="text-sm text-muted-foreground">Anyone with the link can open it.</p>
            </div>
          </div>
          <button onClick={onClose} title="Close" className="btn-ghost h-8 w-8"><X className="h-4 w-4" /></button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2">
          {OPTIONS.map(({ value, icon: Icon, label, body }) => (
            <button
              key={value}
              onClick={() => { setPermission(value); setLink(null) }}
              className={cn(
                'rounded-xl border p-3 text-left transition',
                permission === value ? 'border-brand bg-brand-soft ring-2 ring-brand/20' : 'hover:bg-accent/60'
              )}
            >
              <Icon className={cn('mb-2 h-4 w-4', permission === value ? 'text-brand' : 'text-muted-foreground')} />
              <p className="text-sm font-medium">{label}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{body}</p>
            </button>
          ))}
        </div>

        {!link ? (
          <button onClick={generate} disabled={loading} className="btn-primary h-10 w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating link…</> : 'Create link'}
          </button>
        ) : (
          <div className="flex gap-2 animate-fade-in">
            <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="field flex-1 bg-muted font-mono text-xs" />
            <button onClick={copy} className={cn('btn h-10 w-24 border', copied ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-card hover:bg-accent')}>
              {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
