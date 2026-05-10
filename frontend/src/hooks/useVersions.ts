import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Version {
  id: string
  createdAt: string
}

export function useVersions(documentId: string) {
  return useQuery<Version[]>({
    queryKey: ['versions', documentId],
    queryFn: async () => (await api.get(`/documents/${documentId}/versions`)).data,
    enabled: !!documentId,
  })
}

export function useRestoreVersion(documentId: string, onRestored?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (versionId: string) =>
      api.post(`/documents/${documentId}/versions/${versionId}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['versions', documentId] })
      onRestored?.()
    },
  })
}