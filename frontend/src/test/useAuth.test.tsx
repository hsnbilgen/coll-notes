import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLogin, useRegister } from '@/hooks/useAuth'
import { server } from './mocks/server'
import { http, HttpResponse } from 'msw'

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

describe('useLogin', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('mutate with email and password returns isSuccess true and token defined', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    const loginData = { email: 'test@example.com', password: 'password123' }
    result.current.mutate(loginData)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.token).toBe('fake-jwt')
    expect(result.current.data?.user).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'Test'
    })
  })

  it('stores token in localStorage on successful login', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

    result.current.mutate({ email: 'test@example.com', password: 'password123' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(localStorage.getItem('coll-notes-token')).toBe('fake-jwt')
  })
})

describe('useRegister', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()

    // Add register handler for each test
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json({
          token: 'reg-token',
          user: { id: 'u1', email: 'new@example.com', name: 'New', createdAt: new Date().toISOString() }
        }, { status: 201 })
      )
    )
  })

  it('mutate with email, password, and name returns isSuccess true and user email matches input', async () => {
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() })

    const registerData = { email: 'new@example.com', password: 'password123', name: 'New' }
    result.current.mutate(registerData)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.token).toBe('reg-token')
    expect(result.current.data?.user.email).toBe('new@example.com')
    expect(result.current.data?.user.name).toBe('New')
    expect(result.current.data?.user.id).toBe('u1')
  })

  it('stores token in localStorage on successful registration', async () => {
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() })

    result.current.mutate({ email: 'new@example.com', password: 'password123', name: 'New' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(localStorage.getItem('coll-notes-token')).toBe('reg-token')
  })
})