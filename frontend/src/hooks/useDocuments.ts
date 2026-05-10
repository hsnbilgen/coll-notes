import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Document {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export function useDocuments() {
  return useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get('/documents')).data,
  })
}

export function useTrashDocuments() {
  return useQuery<(Document & { deletedAt: string })[]>({
    queryKey: ['documents', 'trash'],
    queryFn: async () => (await api.get('/documents/trash')).data,
  })
}

export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post<Document>('/documents')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useRenameDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) =>
      (await api.patch<Document>(`/documents/${id}`, { title })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useRestoreDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.post(`/documents/${id}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['documents', 'trash'] })
    },
  })
}

export function useHardDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/documents/${id}/permanent`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', 'trash'] }),
  })
}

export function useDuplicateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Document>(`/documents/${id}/duplicate`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}