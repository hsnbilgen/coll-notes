import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app'

async function registerAndGetToken(email = 'version@example.com') {
  const res = await request(app).post('/api/auth/register').send({
    email,
    password: 'password123',
    name: 'Version User',
  })
  return res.body.token as string
}

describe('Version Management', () => {
  it('saves a version snapshot', async () => {
    const token = await registerAndGetToken()

    // Create a document first
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
    const documentId = createRes.body.id

    // Save a version
    const res = await request(app)
      .post(`/api/documents/${documentId}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: [1, 2, 3, 4, 5] })

    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.createdAt).toBeDefined()
  })

  it('returns 404 when document belongs to another user', async () => {
    const token1 = await registerAndGetToken('owner@example.com')
    const token2 = await registerAndGetToken('other@example.com')

    // User 1 creates a document
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token1}`)
    const documentId = createRes.body.id

    // User 2 tries to save a version
    const res = await request(app)
      .post(`/api/documents/${documentId}/versions`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ content: [1, 2, 3, 4, 5] })

    expect(res.status).toBe(404)
  })

  it('lists versions (empty initially)', async () => {
    const token = await registerAndGetToken()

    // Create a document
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
    const documentId = createRes.body.id

    // List versions (should be empty)
    const res = await request(app)
      .get(`/api/documents/${documentId}/versions`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('lists versions after creating one', async () => {
    const token = await registerAndGetToken()

    // Create a document
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
    const documentId = createRes.body.id

    // Save a version
    await request(app)
      .post(`/api/documents/${documentId}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: [1, 2, 3, 4, 5] })

    // List versions (should have 1)
    const res = await request(app)
      .get(`/api/documents/${documentId}/versions`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBeDefined()
    expect(res.body[0].createdAt).toBeDefined()
  })

  it('returns 404 for another user\'s document when listing versions', async () => {
    const token1 = await registerAndGetToken('owner2@example.com')
    const token2 = await registerAndGetToken('other2@example.com')

    // User 1 creates a document
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token1}`)
    const documentId = createRes.body.id

    // User 2 tries to list versions
    const res = await request(app)
      .get(`/api/documents/${documentId}/versions`)
      .set('Authorization', `Bearer ${token2}`)

    expect(res.status).toBe(404)
  })

  it('restores a version', async () => {
    const token = await registerAndGetToken()

    // Create a document
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
    const documentId = createRes.body.id

    // Save a version
    const versionRes = await request(app)
      .post(`/api/documents/${documentId}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: [1, 2, 3, 4, 5] })
    const versionId = versionRes.body.id

    // Restore the version
    const res = await request(app)
      .post(`/api/documents/${documentId}/versions/${versionId}/restore`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBeDefined()
    expect(res.body.restoredFromVersion).toBe(versionId)
  })

  it('returns 404 for non-existent version id when restoring', async () => {
    const token = await registerAndGetToken()

    // Create a document
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
    const documentId = createRes.body.id

    // Try to restore non-existent version
    const res = await request(app)
      .post(`/api/documents/${documentId}/versions/non-existent-id/restore`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})