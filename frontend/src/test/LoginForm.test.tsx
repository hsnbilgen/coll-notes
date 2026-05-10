import { render } from '@testing-library/react'
import { screen, fireEvent, waitFor } from '@testing-library/dom'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/server'
import { LoginForm } from '@/components/auth/LoginForm'

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    render(<LoginForm />, { wrapper })
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('shows loading state on submit', async () => {
    // Use a delayed response so the pending/loading state is observable
    server.use(
      http.post('/api/auth/login', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json({ token: 'fake-jwt', user: { id: '1', email: 'test@example.com', name: 'Test' } })
      })
    )
    render(<LoginForm />, { wrapper })
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/signing in/i)).toBeInTheDocument())
  })

  it('shows error message on login failure', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      )
    )
    render(<LoginForm />, { wrapper })
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'bad@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    )
  })
})