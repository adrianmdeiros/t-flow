'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createCard, updateCard } from '@/actions/cards'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/compress-image'
import { useBoardContext } from './board-context'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import type { Card } from '@/types'

interface CardFormProps {
  boardId: string
  columnId?: string | null
  existingCard?: Card
  open: boolean
  onClose: () => void
  userId: string
}

/**
 * Outer wrapper: only mounts the inner form when open,
 * so useState always re-initializes from fresh props.
 */
export function CardForm(props: CardFormProps) {
  if (!props.open) return null
  return <CardFormInner {...props} />
}

function CardFormInner({ boardId, columnId, existingCard, open, onClose, userId }: CardFormProps) {
  const { runServerAction } = useBoardContext()
  const [title, setTitle] = useState(existingCard?.title ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(existingCard?.imageUrl ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter menos de 5MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() && !imageFile && !imagePreview) {
      setError('Adicione um título ou imagem')
      return
    }
    setLoading(true)
    setError('')

    let imageUrl = existingCard?.imageUrl ?? null

    if (imageFile) {
      const compressed = await compressImage(imageFile)
      const supabase = createClient()
      const path = `${userId}/${existingCard?.id ?? crypto.randomUUID()}_${Date.now()}`
      const { error: uploadError } = await supabase.storage
        .from('card-images')
        .upload(path, compressed, { upsert: true })

      if (uploadError) {
        setError('Falha no upload: ' + uploadError.message)
        setLoading(false)
        return
      }
      imageUrl = path
    }

    await runServerAction(async () => {
      if (existingCard) {
        await updateCard(existingCard.id, {
          title: title.trim() || null,
          imageUrl,
        })
      } else {
        await createCard(boardId, {
          columnId: columnId ?? null,
          title: title.trim() || null,
          imageUrl,
        })
      }
    })

    setLoading(false)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={existingCard ? 'Editar card' : 'Novo card'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título (opcional)"
          placeholder="Título do card..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Imagem (opcional)</label>
          {imagePreview && (
            <div className="relative w-full h-40">
              <Image
                src={imagePreview.startsWith('blob:') ? imagePreview : `https://utynojjnhvtntijjjjzh.supabase.co/storage/v1/object/public/card-images/${imagePreview}`}
                alt="Card image"
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            {imagePreview ? 'Alterar imagem' : 'Enviar imagem'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {error && <p className="text-sm text-[--destructive]">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="success" disabled={loading}>
            {loading ? <Spinner size="sm" className="border-white/30 border-t-white" /> : existingCard ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
