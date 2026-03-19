import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--background]">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-[--border] bg-[--card] p-8 shadow-md">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">TierFlow</h1>
          <p className="text-sm text-[--muted]">Entre com seu email para continuar</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
