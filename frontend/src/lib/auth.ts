const TOKEN_KEY = 'coll-notes-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function decodeUser(token: string): { id: string; email: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { id: payload.id, email: payload.email }
  } catch {
    return null
  }
}

export function getCurrentUser(): { id: string; email: string } | null {
  const token = getToken()
  if (!token) return null
  return decodeUser(token)
}