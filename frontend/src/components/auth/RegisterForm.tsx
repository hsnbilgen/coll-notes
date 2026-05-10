import { useState } from 'react'
import { useRegister } from '@/hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const register = useRegister()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await register.mutateAsync({ name, email, password })
    navigate('/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold">Create account</h1>
      {register.error && (
        <p className="text-destructive text-sm">Registration failed. Email may already be taken.</p>
      )}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
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
        placeholder="Password (min 8 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
        className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={register.isPending}
        className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {register.isPending ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-sm text-muted-foreground text-center">
        Have an account? <Link to="/login" className="underline">Sign in</Link>
      </p>
    </form>
  )
}