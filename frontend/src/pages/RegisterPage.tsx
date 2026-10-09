import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthLayout } from '@/components/auth/AuthLayout'

export function RegisterPage() {
  return (
    <AuthLayout title="Create your workspace" subtitle="Free, private, and ready in a few seconds.">
      <RegisterForm />
    </AuthLayout>
  )
}
