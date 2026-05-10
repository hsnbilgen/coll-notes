import { useState } from 'react'
import { useLogin } from '@/hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login.mutateAsync({ email, password })
      navigate('/')
    } catch {
      // error displayed via login.error
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold">Sign in</h1>
      {login.error && (
        <p className="text-destructive text-sm">Invalid email or password</p>
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={login.isPending}
        className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-sm text-muted-foreground text-center">
        No account? <Link to="/register" className="underline">Register</Link>
      </p>
    </form>
  )
}