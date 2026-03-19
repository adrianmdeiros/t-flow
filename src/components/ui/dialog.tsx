'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import {
  useRef,
  useEffect,
  type ReactNode,
  type HTMLAttributes,
} from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      className={cn(
        'rounded-lg border border-[--border] shadow-lg backdrop:bg-black/50 w-full max-w-md p-6 m-auto',
        className
      )}
      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      onCancel={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        <button
          onClick={onClose}
          className="ml-auto rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </dialog>
  )
}
