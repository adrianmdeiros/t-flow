import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

  const initials = user.email?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur animate-in fade-in duration-300">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="font-bold text-lg hover:opacity-70 transition-opacity">TierFlow</Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <NavLink href="/" icon={<LayoutDashboard className="h-4 w-4" />} exact>
              Meus Quadros
            </NavLink>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <Tooltip>
              <TooltipTrigger asChild>
                <div><ThemeToggle /></div>
              </TooltipTrigger>
              <TooltipContent>Alternar tema</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <form action={signOut}>
                  <Button variant="ghost" size="icon" type="submit">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </form>
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
            <Avatar size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
