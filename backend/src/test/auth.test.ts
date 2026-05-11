import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app'

describe('POST /api/v1/auth/register', () => {
  it('creates a user and returns token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('test@example.com')
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('returns 409 when email already exists', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'dupe@example.com',
      password: 'password123',
      name: 'First',
    })
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'dupe@example.com',
      password: 'password123',
      name: 'Second',
    })
    expect(res.status).toBe(409)
  })

  it('rejects short password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'bad@example.com',
      password: 'short',
      name: 'User',
    })
    expect(res.status).toBe(422)
  })
})

describe('POST /api/v1/auth/login', () => {
  it('returns token for valid credentials', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'login@example.com',
      password: 'password123',
      name: 'Login User',
    })
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('returns 401 for wrong password', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'wrong@example.com',
      password: 'password123',
      name: 'User',
    })
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'wrong@example.com',
      password: 'wrongpassword',
    })
    expect(res.status).toBe(401)
  })
})
