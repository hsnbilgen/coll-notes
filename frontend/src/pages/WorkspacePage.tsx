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
          <SharedDocView shareToken={activeShareToken} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select a document or create a new one
          </div>
        )}
      </main>
    </div>
  )
}
