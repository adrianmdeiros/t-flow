'use client'

import { memo, useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, Pencil, Trash2, Copy, Loader2 } from 'lucide-react'
import { deleteCard, duplicateCard } from '@/actions/cards'
import { useBoardContext } from './board-context'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Card as CardWrapper } from '@/components/ui/card'
import { CardForm } from './card-form'
import { toast } from 'sonner'
import type { Card as CardType } from '@/types'

interface CardProps {
  card: CardType
  userId: string
  boardId: string
}

export const Card = memo(function Card({ card, userId, boardId }: CardProps) {
  const { runServerAction } = useBoardContext()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [animateIn, setAnimateIn] = useState(() => Date.now() - new Date(card.createdAt).getTime() < 2000)

  useEffect(() => {
    if (animateIn) {
      const timer = setTimeout(() => setAnimateIn(false), 300)
      return () => clearTimeout(timer)
    }
  }, [animateIn])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `card:${card.id}` })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  const imageUrl = card.imageUrl
    ? `https://utynojjnhvtntijjjjzh.supabase.co/storage/v1/object/public/card-images/${card.imageUrl}`
    : null

  const imageHeightClass =
    card.imageSize === 'small' ? 'h-24' : card.imageSize === 'medium' ? 'h-28' : 'h-32'

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group relative touch-manipulation ${animateIn ? 'animate-card-in' : ''} ${deleting ? 'animate-card-out' : ''}`}
      >
        <CardWrapper className="p-0 gap-0 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow duration-200">
          {imageUrl && (
            <div className={`relative w-full ${imageHeightClass}`}>
              <Image
                src={imageUrl}
                alt={card.title ?? 'Card image'}
                fill
                className="object-cover"
              />
            </div>
          )}
          {card.title ? (
            <div className="p-3">
              <p className="text-sm text-card-foreground">{card.title}</p>
            </div>
          ) : !imageUrl ? (
            <div className="p-3">
              <p className="text-sm text-muted-foreground italic">Card vazio</p>
            </div>
          ) : null}
        </CardWrapper>

        {(loading || deleting) && (
          <div className={`absolute inset-0 flex items-center justify-center rounded-lg z-10 ${deleting ? 'bg-destructive/15' : 'bg-background/60'}`}>
            <Loader2 className={`h-5 w-5 animate-spin ${deleting ? 'text-destructive' : 'text-muted-foreground'}`} />
          </div>
        )}

        <div className="absolute top-1 right-1 sm:hidden sm:group-hover:block has-data-[state=open]:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-6 w-6 flex items-center justify-center bg-black/60 shadow-sm cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" collisionPadding={8}>
              <DropdownMenuItem disabled={loading} onPointerDown={(e) => e.stopPropagation()} onSelect={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem disabled={loading} onPointerDown={(e) => e.stopPropagation()} onSelect={async () => {
                setLoading(true)
                await runServerAction(() => duplicateCard(card.id))
                toast.success('Card duplicado')
                setLoading(false)
              }}>
                <Copy className="h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem disabled={loading} variant="destructive" onPointerDown={(e) => e.stopPropagation()} onSelect={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardForm
        boardId={boardId}
        existingCard={card}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        userId={userId}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir card</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este card?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={async (e) => {
                e.preventDefault()
                setConfirmDelete(false)
                setDeleting(true)
                await runServerAction(() => deleteCard(card.id))
                toast.success('Card excluído')
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
