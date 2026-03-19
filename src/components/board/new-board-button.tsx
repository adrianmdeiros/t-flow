'use client'

import { useState } from 'react'
import { createBoard } from '@/actions/boards'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

export function NewBoardButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await createBoard(formData)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
    } else {
      setOpen(false)
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Novo quadro
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Criar quadro">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="title"
            label="Título do quadro"
            placeholder="Meu quadro incrível"
            required
            autoFocus
            error={error}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
