import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app'

async function registerAndGetToken(email = 'share@example.com') {
  const res = await request(app).post('/api/auth/register').send({
    email,
    password: 'password123',
    name: 'Share User',
  })
  return res.body.token as string
}

describe('Document Sharing', () => {
  it('creates a share link with READ_ONLY permission (default)', async () => {
    const token = await registerAndGetToken()

    // Create a document first
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
    const documentId = createRes.body.id

    // Create a share link
    const res = await request(app)
      .post(`/api/documents/${documentId}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.permission).toBe('READ_ONLY')
    expect(res.body.url).toBeDefined()
    expect(typeof res.body.token).toBe('string')
  })

  it('creates a share link with EDITABLE permission when specified', async () => {
    const token = await registerAndGetToken()

    // Create a document
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
    const documentId = createRes.body.id

    // Create an editable share link
    const res = await request(app)
      .post(`/api/documents/${documentId}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permission: 'EDITABLE' })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.permission).toBe('EDITABLE')
    expect(res.body.url).toBeDefined()
  })

  it('returns 404 when document belongs to another user', async () => {
    const token1 = await registerAndGetToken('owner@example.com')
    const token2 = await registerAndGetToken('other@example.com')

    // User 1 creates a document
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token1}`)
    const documentId = createRes.body.id

    // User 2 tries to share it
    const res = await request(app)
      .post(`/api/documents/${documentId}/share`)
      .set('Authorization', `Bearer ${token2}`)
      .send({})

    expect(res.status).toBe(404)
  })

  it('returns 401 without auth token', async () => {
    // Try to share without authorization
    const res = await request(app)
      .post('/api/documents/some-id/share')
      .send({})

    expect(res.status).toBe(401)
  })

  it('resolves a share token', async () => {
    const token = await registerAndGetToken()

    // Create a document
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
    const documentId = createRes.body.id

    // Rename the document to something recognizable
    await request(app)
      .patch(`/api/documents/${documentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Shared Document' })

    // Create a share link
    const shareRes = await request(app)
      .post(`/api/documents/${documentId}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permission: 'READ_ONLY' })
    const shareToken = shareRes.body.token

    // Resolve the share token
    const res = await request(app)
      .get(`/api/share/${shareToken}`)

    expect(res.status).toBe(200)
    expect(res.body.document).toBeDefined()
    expect(res.body.document.id).toBe(documentId)
    expect(res.body.document.title).toBe('Shared Document')
    expect(res.body.permission).toBe('READ_ONLY')
  })

  it('returns 404 for a random non-existent token string', async () => {
    const res = await request(app)
      .get('/api/share/random-non-existent-token-12345')

    expect(res.status).toBe(404)
  })
})