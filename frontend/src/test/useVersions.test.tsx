import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useVersions, useRestoreVersion } from '@/hooks/useVersions'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useVersions', () => {
  it('fetches and returns 2 versions from the mock', async () => {
    const { result } = renderHook(() => useVersions('doc-1'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0]).toHaveProperty('id', 'v1')
    expect(result.current.data?.[1]).toHaveProperty('id', 'v2')
    expect(result.current.data?.[0]).toHaveProperty('createdAt')
    expect(result.current.data?.[1]).toHaveProperty('createdAt')
  })

  it('is disabled when documentId is empty', () => {
    const { result } = renderHook(() => useVersions(''), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })
})

describe('useRestoreVersion', () => {
  it('mutate with v1 returns isSuccess true and restoredFromVersion equals v1', async () => {
    const { result } = renderHook(() => useRestoreVersion('doc-1'), { wrapper: createWrapper() })

    result.current.mutate('v1')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.data.restoredFromVersion).toBe('v1')
    expect(result.current.data?.data.id).toBe('doc-1')
  })

  it('calls onRestored callback on success', async () => {
    let called = false
    const onRestored = () => { called = true }

    const { result } = renderHook(() => useRestoreVersion('doc-1', onRestored), { wrapper: createWrapper() })

    result.current.mutate('v2')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(called).toBe(true)
  })
})