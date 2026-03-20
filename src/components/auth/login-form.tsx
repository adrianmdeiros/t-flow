'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setStatus('loading')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
      setStatus('idle')
    } else {
      setStatus('success')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-2 animate-in fade-in duration-300">
        <h2 className="text-lg font-semibold">Verifique seu email</h2>
        <p className="text-sm text-muted-foreground">
          Enviamos um magic link para <strong>{email}</strong>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={status === 'loading'}>
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar magic link'}
      </Button>
    </form>
  )
}
