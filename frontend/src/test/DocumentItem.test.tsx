import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { DocumentItem } from '@/components/sidebar/DocumentItem'
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
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('DocumentItem', () => {
  const defaultProps = {
    id: 'doc-1',
    title: 'First Note',
    isActive: false,
    onSelect: vi.fn(),
  }

  it('renders the document title', () => {
    render(<DocumentItem {...defaultProps} />, { wrapper: createWrapper() })

    expect(screen.getByText('First Note')).toBeInTheDocument()
  })

  it('shows action buttons on hover', () => {
    render(<DocumentItem {...defaultProps} />, { wrapper: createWrapper() })

    const container = screen.getByText('First Note').parentElement!

    // Initially buttons are hidden (but exist in DOM)
    expect(screen.getByTitle('Rename')).toBeInTheDocument()
    expect(screen.getByTitle('Duplicate')).toBeInTheDocument()
    expect(screen.getByTitle('Move to trash')).toBeInTheDocument()

    // Hover over the container
    fireEvent.mouseOver(container)

    // Buttons should still be there (jsdom doesn't compute CSS hover visibility)
    expect(screen.getByTitle('Rename')).toBeInTheDocument()
    expect(screen.getByTitle('Duplicate')).toBeInTheDocument()
    expect(screen.getByTitle('Move to trash')).toBeInTheDocument()
  })

  it('clicking duplicate button calls POST /api/documents/:id/duplicate', async () => {
    let duplicateRequestMade = false

    // Override the duplicate handler to track requests
    server.use(
      http.post('/api/v1/documents/:id/duplicate', ({ params }) => {
        duplicateRequestMade = true
        expect(params.id).toBe('doc-1')
        return HttpResponse.json({
          id: 'doc-dup',
          title: 'Copy of First Note',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { status: 201 })
      })
    )

    render(<DocumentItem {...defaultProps} />, { wrapper: createWrapper() })

    const duplicateButton = screen.getByTitle('Duplicate')
    fireEvent.click(duplicateButton)

    await waitFor(() => {
      expect(duplicateRequestMade).toBe(true)
    })
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<DocumentItem {...defaultProps} onSelect={onSelect} />, { wrapper: createWrapper() })

    const container = screen.getByText('First Note').parentElement!
    fireEvent.click(container)

    expect(onSelect).toHaveBeenCalledWith('doc-1')
  })

  it('shows Untitled when title is empty', () => {
    render(<DocumentItem {...defaultProps} title="" />, { wrapper: createWrapper() })

    expect(screen.getByText('Untitled')).toBeInTheDocument()
  })

  it('applies active styles when isActive is true', () => {
    render(<DocumentItem {...defaultProps} isActive={true} />, { wrapper: createWrapper() })

    const container = screen.getByText('First Note').parentElement!
    expect(container).toHaveClass('bg-accent', 'text-accent-foreground')
  })
})