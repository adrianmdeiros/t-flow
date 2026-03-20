'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createCard, updateCard } from '@/actions/cards'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/compress-image'
import { useBoardContext } from './board-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Card } from '@/types'

type ImageSize = 'small' | 'medium' | 'large'

const SIZE_LABELS: Record<ImageSize, string> = {
  small: 'Pequena',
  medium: 'Média',
  large: 'Grande',
}

const PREVIEW_WIDTH: Record<ImageSize, string> = {
  small: 'w-48',
  medium: 'w-56',
  large: 'w-64',
}

const PREVIEW_IMAGE_HEIGHT: Record<ImageSize, string> = {
  small: 'h-24',
  medium: 'h-28',
  large: 'h-32',
}

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
  const [imageSize, setImageSize] = useState<ImageSize>((existingCard?.imageSize as ImageSize) ?? 'large')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const hasImage = !!imagePreview

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
          imageSize,
        })
      } else {
        await createCard(boardId, {
          columnId: columnId ?? null,
          title: title.trim() || null,
          imageUrl,
          imageSize,
        })
      }
    })

    toast.success(existingCard ? 'Card atualizado' : 'Card criado')
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existingCard ? 'Editar card' : 'Novo card'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card-title">Título (opcional)</Label>
            <Input
              id="card-title"
              placeholder="Título do card..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem (opcional)</Label>
            {imagePreview && (
              <div className="flex flex-col items-center gap-3 py-2 max-w-full">
                <div className={`${PREVIEW_WIDTH[imageSize]} max-w-full rounded-lg border border-border bg-card shadow-sm overflow-hidden transition-all duration-200`}>
                  <div className={`relative w-full ${PREVIEW_IMAGE_HEIGHT[imageSize]} transition-all duration-200`}>
                    <Image
                      src={imagePreview.startsWith('blob:') ? imagePreview : `https://utynojjnhvtntijjjjzh.supabase.co/storage/v1/object/public/card-images/${imagePreview}`}
                      alt="Card image"
                      fill
                      className="object-cover"
                    />
                  </div>
                  {title.trim() && (
                    <div className="p-3">
                      <p className="text-sm text-card-foreground truncate">{title}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Preview do card</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                {imagePreview ? 'Alterar imagem' : 'Enviar imagem'}
              </Button>
              {imagePreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setImageFile(null); setImagePreview(null) }}
                >
                  Remover
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {hasImage && (
            <div className="space-y-2">
              <Label>Tamanho da imagem</Label>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setImageSize(size)}
                    className={`flex-1 px-3 py-1.5 text-sm border rounded-md cursor-pointer transition-colors ${
                      imageSize === size
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {SIZE_LABELS[size]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="success" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : existingCard ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
