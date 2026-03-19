import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { LogOut, LayoutDashboard } from 'lucide-react'
import { NavLink } from '@/components/nav-link'

async function signOut() {
  'use server'
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="sticky top-0 z-10 border-b border-[--border] bg-[--background]/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="font-bold text-lg hover:opacity-70 transition-opacity">TierFlow</Link>
          <div className="flex items-center gap-2">
            <NavLink href="/" icon={<LayoutDashboard className="h-4 w-4" />} exact>
              Meus Quadros
            </NavLink>
            <ThemeToggle />
            <form action={signOut}>
              <Button variant="ghost" size="icon" type="submit" title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
