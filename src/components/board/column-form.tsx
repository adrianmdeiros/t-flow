'use client'

import { useState } from 'react'
import { createColumn } from '@/actions/columns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

interface ColumnFormProps {
  boardId: string
}

export function ColumnForm({ boardId }: ColumnFormProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await createColumn(boardId, title.trim())
    setTitle('')
    setOpen(false)
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-64 shrink-0 h-12 rounded-lg border-2 border-dashed border-[--border] hover:border-[--primary] hover:bg-[--accent] transition-colors flex items-center justify-center cursor-pointer self-start"
      >
        <Plus className="h-5 w-5 text-[--muted]" />
      </button>
    )
  }

  return (
    <div className="w-64 shrink-0">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input
          placeholder="Título da coluna"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="submit" variant="success" size="sm" disabled={loading}>
            {loading ? '...' : 'Adicionar'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
