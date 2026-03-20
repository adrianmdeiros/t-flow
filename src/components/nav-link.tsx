'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'

interface NavLinkProps {
  href: string
  icon: ReactNode
  children: ReactNode
  exact?: boolean
}

export function NavLink({ href, icon, children, exact = false }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 text-sm px-2 py-1 transition-colors ${
        isActive
          ? 'text-foreground bg-accent font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  )
}
