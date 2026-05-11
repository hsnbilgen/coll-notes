import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/v1/auth/login', () =>
    HttpResponse.json({ token: 'fake-jwt', user: { id: '1', email: 'test@example.com', name: 'Test' } })
  ),
  http.get('/api/v1/documents', () =>
    HttpResponse.json([
      { id: 'doc-1', title: 'First Note', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ])
  ),
  http.post('/api/v1/documents', () =>
    HttpResponse.json({ id: 'doc-new', title: 'Untitled', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { status: 201 })
  ),
  http.patch('/api/v1/documents/:id', ({ params }) =>
    HttpResponse.json({ id: params.id, title: 'Renamed', updatedAt: new Date().toISOString() })
  ),
  http.delete('/api/v1/documents/:id/permanent', () => HttpResponse.json({ ok: true })),
  http.delete('/api/v1/documents/:id', () => HttpResponse.json({ ok: true })),

  // New handlers for versions, duplicate, and sharing
  http.post('/api/v1/documents/:id/duplicate', () =>
    HttpResponse.json({
      id: 'doc-dup',
      title: 'Copy of First Note',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { status: 201 })
  ),
  http.get('/api/v1/documents/:id/versions', () =>
    HttpResponse.json([
      { id: 'v1', createdAt: new Date(Date.now() - 86400000).toISOString() }, // 1 day ago
      { id: 'v2', createdAt: new Date().toISOString() }
    ])
  ),
  http.post('/api/v1/documents/:id/versions/:vid/restore', ({ params }) =>
    HttpResponse.json({
      id: params.id,
      restoredFromVersion: params.vid
    }, { status: 200 })
  ),
  http.post('/api/v1/documents/:id/share', () =>
    HttpResponse.json({
      token: 'share-token-abc',
      permission: 'READ_ONLY',
      url: 'http://localhost:5173/share/share-token-abc'
    }, { status: 201 })
  ),
  http.get('/api/v1/share/:token', () =>
    HttpResponse.json({
      document: { id: 'doc-1', title: 'First Note' },
      permission: 'READ_ONLY'
    }, { status: 200 })
  ),
]