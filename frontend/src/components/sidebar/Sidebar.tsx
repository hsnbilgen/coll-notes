import { useState } from 'react'
import { useCreateDocument } from '@/hooks/useDocuments'
import { useLogout, useCurrentUser } from '@/hooks/useAuth'
import { DocumentList } from './DocumentList'
import { TrashList } from './TrashList'
import { SharedWithMeList } from './SharedWithMeList'
import { useFocus } from '@/context/FocusContext'
import { cn } from '@/lib/utils'

interface Props {
  activeId: string | null
  activeShareToken: string | null
  onSelect: (id: string) => void
  onSelectShared: (shareToken: string) => void
}

export function Sidebar({ activeId, activeShareToken, onSelect, onSelectShared }: Props) {
  const [showTrash, setShowTrash] = useState(false)
  const [showShared, setShowShared] = useState(true)
  const create = useCreateDocument()
  const logout = useLogout()
  const user = useCurrentUser()
  const { isFocused } = useFocus()

  const handleCreate = async () => {
    const doc = await create.mutateAsync()
    onSelect(doc.id)
  }

  return (
    <aside
      className={cn(
        'w-60 border-r bg-muted/30 flex flex-col h-full transition-all duration-200',
        isFocused && 'w-0 overflow-hidden border-none'
      )}
    >
      <div className="p-3 border-b">
        <p className="text-sm font-semibold truncate">{user?.email}</p>
        <button
          onClick={handleCreate}
          disabled={create.isPending}
          className="mt-2 w-full text-left text-sm px-2 py-1 rounded hover:bg-accent"
        >
          + New document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-xs text-muted-foreground uppercase px-1 mb-1">Documents</p>
        <DocumentList activeId={activeId} onSelect={onSelect} />

        <button
          onClick={() => setShowShared((v) => !v)}
          className="text-xs text-muted-foreground uppercase px-1 mt-4 mb-1 w-full text-left hover:text-foreground"
        >
          {showShared ? '▾' : '▸'} Shared with me
        </button>
        {showShared && (
          <SharedWithMeList
            activeShareToken={activeShareToken}
            onSelect={onSelectShared}
          />
        )}

        <button
          onClick={() => setShowTrash((v) => !v)}
          className="text-xs text-muted-foreground uppercase px-1 mt-4 mb-1 w-full text-left hover:text-foreground"
        >
          {showTrash ? '▾' : '▸'} Trash
        </button>
        {showTrash && <TrashList />}
      </div>

      <div className="p-3 border-t">
        <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </div>
    </aside>
  )
}
