import { FilePlus2, Command, Users, History } from 'lucide-react'
import { useCreateDocument, useDocuments } from '@/hooks/useDocuments'
import { useCurrentUser } from '@/hooks/useAuth'
import { useNavigate, useParams } from 'react-router-dom'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { DocumentPage } from './DocumentPage'
import { SharedDocView } from './SharedDocView'

export function WorkspacePage() {
  const { id, token } = useParams<{ id?: string; token?: string }>()
  const activeDocId = id ?? null
  const activeShareToken = token ?? null
  const navigate = useNavigate()

  const selectDoc = (id: string) => {
    navigate(`/documents/${id}`)
  }

  const selectShared = (shareToken: string) => {
    navigate(`/shared/${shareToken}`)
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        activeId={activeDocId}
        activeShareToken={activeShareToken}
        onSelect={selectDoc}
        onSelectShared={selectShared}
      />
      <main className="flex-1 overflow-hidden">
        {activeDocId ? (
          <DocumentPage documentId={activeDocId} />
        ) : activeShareToken ? (
          <SharedDocView key={activeShareToken} shareToken={activeShareToken} />
        ) : (
          <EmptyState onSelect={selectDoc} />
        )}
      </main>
    </div>
  )
}


function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const TIPS = [
  { icon: Command, title: 'Type / for blocks', body: 'Headings, lists, code, and ready-made templates.' },
  { icon: Users, title: 'Share a link', body: 'Invite anyone to view or edit — no account needed.' },
  { icon: History, title: '⌘S saves a version', body: 'Restore any snapshot from the History panel.' },
]

function EmptyState({ onSelect }: { onSelect: (id: string) => void }) {
  const create = useCreateDocument()
  const { data: docs } = useDocuments()
  const user = useCurrentUser()
  const name = user?.email?.split('@')[0]
  const recent = docs?.slice(0, 4) ?? []

  const handleCreate = async () => {
    const doc = await create.mutateAsync()
    onSelect(doc.id)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-20 animate-pop-in">
        <p className="text-sm font-medium text-brand">{greeting()}{name ? `, ${name}` : ''}</p>
        <h1 className="mt-2 font-serif text-5xl tracking-tight">What are we writing today?</h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Start a fresh note, or jump back into something you were working on.
        </p>

        <button onClick={handleCreate} disabled={create.isPending} className="btn-primary mt-8 h-11 px-5">
          <FilePlus2 className="h-4 w-4" /> New document
        </button>

        {recent.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {recent.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  className="group rounded-xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                >
                  <p className="truncate font-serif text-lg group-hover:text-brand">{d.title || 'Untitled'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Edited {new Date(d.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 grid gap-6 border-t pt-8 sm:grid-cols-3">
          {TIPS.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
