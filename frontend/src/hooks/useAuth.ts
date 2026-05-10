import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { setToken, clearToken, getCurrentUser } from '@/lib/auth'

interface AuthResponse {
  token: string
  user: { id: string; email: string; name: string; createdAt: string }
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post<AuthResponse>('/auth/login', data)
      setToken(res.data.token)
      return res.data
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const res = await api.post<AuthResponse>('/auth/register', data)
      setToken(res.data.token)
      return res.data
    },
  })
}

export function useLogout() {
  return () => {
    clearToken()
    window.location.href = '/login'
  }
}

export function useCurrentUser() {
  return getCurrentUser()
}