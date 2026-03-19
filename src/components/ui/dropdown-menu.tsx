'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
}

export function DropdownMenu({ trigger, children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 4,
      left: rect.right,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) return
      setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const handleScroll = () => updatePosition()

    document.addEventListener('pointerdown', handleClick)
    document.addEventListener('keydown', handleKey)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('pointerdown', handleClick)
      document.removeEventListener('keydown', handleKey)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, updatePosition])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setOpen((v) => !v)
        }}
        className="flex items-center justify-center cursor-pointer"
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              transform: 'translateX(-100%)',
              zIndex: 9999,
            }}
            className="min-w-[140px] rounded-md border border-[--border] shadow-lg animate-[slideDown_150ms_ease-out]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div
              className="py-1 rounded-md"
              style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              onClick={() => setOpen(false)}
            >
              {children}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

interface DropdownItemProps {
  onClick: () => void
  icon?: ReactNode
  variant?: 'default' | 'destructive'
  children: ReactNode
}

export function DropdownItem({ onClick, icon, variant = 'default', children }: DropdownItemProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[--accent] transition-colors ${
        variant === 'destructive' ? 'text-[--destructive]' : ''
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
