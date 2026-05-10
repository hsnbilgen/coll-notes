import { renderHook } from '@testing-library/react'
import { waitFor } from '@testing-library/dom'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDocuments, useCreateDocument } from '@/hooks/useDocuments'

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useDocuments', () => {
  it('fetches and returns documents', async () => {
    const { result } = renderHook(() => useDocuments(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].title).toBe('First Note')
  })
})

describe('useCreateDocument', () => {
  it('returns new document on mutate', async () => {
    const { result } = renderHook(() => useCreateDocument(), { wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe('doc-new')
  })
})