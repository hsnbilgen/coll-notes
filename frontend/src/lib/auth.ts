const TOKEN_KEY = 'coll-notes-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event('storage'))
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event('storage'))
}

export function decodeUser(token: string): { id: string; email: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
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