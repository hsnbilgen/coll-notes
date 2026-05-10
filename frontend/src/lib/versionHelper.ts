import { api } from './api'

export async function createVersion(documentId: string, content: Uint8Array) {
  await api.post(`/documents/${documentId}/versions`, {
    content: Array.from(content),
  }).catch(() => {})
}