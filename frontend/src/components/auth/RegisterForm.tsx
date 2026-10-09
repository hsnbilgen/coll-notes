import { useState } from 'react'
import { useRegister } from '@/hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const register = useRegister()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register.mutateAsync({ name, email, password })
      navigate('/')
    } catch {
      // error displayed via register.error
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {register.error && (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Registration failed. Email may already be taken.
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Name
        <input
          type="text"
          placeholder="Ada Lovelace"
          autoComplete="name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="field font-normal"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          className="field font-normal"
        />
      </label>
      <button type="submit" disabled={register.isPending} className="btn-primary mt-2 h-11 group">
        {register.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
        ) : (
          <>Create account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
        )}
      </button>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
