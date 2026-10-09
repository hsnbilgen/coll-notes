import { LoginForm } from '@/components/auth/LoginForm'
import { AuthLayout } from '@/components/auth/AuthLayout'

export function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <LoginForm />
    </AuthLayout>
  )
}
