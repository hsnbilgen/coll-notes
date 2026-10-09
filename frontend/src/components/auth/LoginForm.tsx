import { useState } from 'react'
import { useLogin } from '@/hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {login.error && (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Invalid email or password
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="field font-normal"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="field font-normal"
        />
      </label>
      <button type="submit" disabled={login.isPending} className="btn-primary mt-2 h-11 group">
        {login.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
        ) : (
          <>Sign in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
        )}
      </button>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link to="/register" className="font-medium text-foreground underline-offset-4 hover:text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}
