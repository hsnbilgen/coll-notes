import { useState } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { DocumentPage } from './DocumentPage'

export function WorkspacePage() {
  const [activeDocId, setActiveDocId] = useState<string | null>(null)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeId={activeDocId} onSelect={setActiveDocId} />
      <main className="flex-1 overflow-hidden">
        {activeDocId ? (
          <DocumentPage documentId={activeDocId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select a document or create a new one
          </div>
        )}
      </main>
    </div>
  )
}