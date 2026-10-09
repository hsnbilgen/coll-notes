import { useEffect, useRef, useState } from 'react'
import { ChevronRight, LogOut, Moon, Plus, Search, Sun, Trash2, Users, FileText, X } from 'lucide-react'
import { useCreateDocument } from '@/hooks/useDocuments'
import { useLogout, useCurrentUser } from '@/hooks/useAuth'
import { DocumentList } from './DocumentList'
import { TrashList } from './TrashList'
import { SharedWithMeList } from './SharedWithMeList'
import { useFocus } from '@/context/FocusContext'
import { useTheme } from '@/context/ThemeContext'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

interface Props {
  activeId: string | null
  activeShareToken: string | null
  onSelect: (id: string) => void
  onSelectShared: (shareToken: string) => void
}

function Section({
  icon: Icon,
  label,
  open,
  onToggle,
  children,
}: {
  icon: typeof FileText
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mt-5 first:mt-0">
      <button
        onClick={onToggle}
        className="group mb-1 flex w-full items-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className={cn('h-3 w-3 transition-transform', open && 'rotate-90')} />
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
      {open && <div className="animate-fade-in">{children}</div>}
    </div>
  )
}

export function Sidebar({ activeId, activeShareToken, onSelect, onSelectShared }: Props) {
  const [showDocs, setShowDocs] = useState(true)
  const [showTrash, setShowTrash] = useState(false)
  const [showShared, setShowShared] = useState(true)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const create = useCreateDocument()
  const logout = useLogout()
  const user = useCurrentUser()
  const { isFocused } = useFocus()
  const { theme, toggleTheme } = useTheme()

  const handleCreate = async () => {
    const doc = await create.mutateAsync()
    onSelect(doc.id)
  }

  // ⌘K focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const initial = (user?.email?.[0] ?? '?').toUpperCase()

  return (
    <aside
      className={cn(
        'bg-sidebar flex h-full w-64 shrink-0 flex-col border-r transition-[width] duration-300 ease-out',
        isFocused && 'w-0 overflow-hidden border-none'
      )}
    >
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <Logo />
        <button onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} className="btn-ghost h-8 w-8">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="space-y-2 px-3 pb-3">
        <button onClick={handleCreate} disabled={create.isPending} className="btn-brand h-9 w-full">
          <Plus className="h-4 w-4" /> New document
        </button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
            placeholder="Search notes"
            className="h-8 w-full rounded-md border border-transparent bg-accent/60 pl-8 pr-10 text-sm outline-none transition placeholder:text-muted-foreground focus:border-border focus:bg-card"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" title="Clear">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="kbd absolute right-2 top-1/2 -translate-y-1/2">⌘K</span>
          )}
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4">
        <Section icon={FileText} label="My notes" open={showDocs} onToggle={() => setShowDocs((v) => !v)}>
          <DocumentList activeId={activeId} onSelect={onSelect} query={query} />
        </Section>
        <Section icon={Users} label="Shared with me" open={showShared} onToggle={() => setShowShared((v) => !v)}>
          <SharedWithMeList activeShareToken={activeShareToken} onSelect={onSelectShared} query={query} />
        </Section>
        <Section icon={Trash2} label="Trash" open={showTrash} onToggle={() => setShowTrash((v) => !v)}>
          <TrashList />
        </Section>
      </nav>

      <div className="flex items-center gap-2.5 border-t px-3 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-amber-400 text-xs font-semibold text-white">
          {initial}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-medium" title={user?.email}>{user?.email}</p>
        <button onClick={logout} title="Sign out" className="btn-ghost h-8 w-8">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
