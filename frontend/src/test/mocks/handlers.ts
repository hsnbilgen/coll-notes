import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/auth/login', () =>
    HttpResponse.json({ token: 'fake-jwt', user: { id: '1', email: 'test@example.com', name: 'Test' } })
  ),
  http.get('/api/documents', () =>
    HttpResponse.json([
      { id: 'doc-1', title: 'First Note', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ])
  ),
  http.post('/api/documents', () =>
    HttpResponse.json({ id: 'doc-new', title: 'Untitled', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { status: 201 })
  ),
  http.patch('/api/documents/:id', ({ params }) =>
    HttpResponse.json({ id: params.id, title: 'Renamed', updatedAt: new Date().toISOString() })
  ),
  http.delete('/api/documents/:id', () => HttpResponse.json({ ok: true })),
]