import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app'

async function registerAndGetToken(email = 'doc@example.com') {
  const res = await request(app).post('/api/auth/register').send({
    email,
    password: 'password123',
    name: 'Doc User',
  })
  return res.body.token as string
}

describe('Document CRUD', () => {
  it('creates a document', async () => {
    const token = await registerAndGetToken()
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.title).toBe('Untitled')
  })

  it('lists only own documents', async () => {
    const token1 = await registerAndGetToken('user1@example.com')
    const token2 = await registerAndGetToken('user2@example.com')
    await request(app).post('/api/documents').set('Authorization', `Bearer ${token1}`)
    await request(app).post('/api/documents').set('Authorization', `Bearer ${token1}`)
    await request(app).post('/api/documents').set('Authorization', `Bearer ${token2}`)
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${token1}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('renames a document', async () => {
    const token = await registerAndGetToken()
    const create = await request(app).post('/api/documents').set('Authorization', `Bearer ${token}`)
    const id = create.body.id
    const res = await request(app)
      .patch(`/api/documents/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Note' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('My Note')
  })

  it('soft deletes and hides from list', async () => {
    const token = await registerAndGetToken()
    const create = await request(app).post('/api/documents').set('Authorization', `Bearer ${token}`)
    const id = create.body.id
    await request(app).delete(`/api/documents/${id}`).set('Authorization', `Bearer ${token}`)
    const list = await request(app).get('/api/documents').set('Authorization', `Bearer ${token}`)
    expect(list.body).toHaveLength(0)
    const trash = await request(app).get('/api/documents/trash').set('Authorization', `Bearer ${token}`)
    expect(trash.body).toHaveLength(1)
  })

  it('restores a soft-deleted document', async () => {
    const token = await registerAndGetToken()
    const create = await request(app).post('/api/documents').set('Authorization', `Bearer ${token}`)
    const id = create.body.id
    await request(app).delete(`/api/documents/${id}`).set('Authorization', `Bearer ${token}`)
    await request(app).post(`/api/documents/${id}/restore`).set('Authorization', `Bearer ${token}`)
    const list = await request(app).get('/api/documents').set('Authorization', `Bearer ${token}`)
    expect(list.body).toHaveLength(1)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/documents')
    expect(res.status).toBe(401)
  })

  it('cannot access another user document', async () => {
    const token1 = await registerAndGetToken('owner@example.com')
    const token2 = await registerAndGetToken('other@example.com')
    const create = await request(app).post('/api/documents').set('Authorization', `Bearer ${token1}`)
    const id = create.body.id
    const res = await request(app)
      .patch(`/api/documents/${id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Stolen' })
    expect(res.status).toBe(404)
  })
})
