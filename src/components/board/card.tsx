'use client'

import { memo, useState } from 'react'
import Image from 'next/image'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { deleteCard } from '@/actions/cards'
import { useBoardContext } from './board-context'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { DropdownMenu, DropdownItem } from '@/components/ui/dropdown-menu'
import { CardForm } from './card-form'
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

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="group relative rounded-md border border-[--border] bg-[--card] shadow-sm cursor-grab active:cursor-grabbing"
      >
        {imageUrl && (
          <div className="relative w-full h-32">
            <Image
              src={imageUrl}
              alt={card.title ?? 'Card image'}
              fill
              className="object-cover rounded-t-md"
            />
          </div>
        )}
        <div className="p-3">
          {card.title && (
            <p className="text-sm text-[--card-foreground]">{card.title}</p>
          )}
          {!card.title && !imageUrl && (
            <p className="text-sm text-[--muted] italic">Card vazio</p>
          )}
        </div>
        <div className="absolute top-1 right-1 hidden group-hover:block">
          <DropdownMenu
            trigger={
              <span className="h-6 w-6 flex items-center justify-center rounded bg-black/60 shadow-sm">
                <MoreHorizontal className="h-4 w-4 text-white" />
              </span>
            }
          >
            <DropdownItem
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setEditOpen(true)}
            >
              Editar
            </DropdownItem>
            <DropdownItem
              icon={<Trash2 className="h-4 w-4" />}
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Excluir
            </DropdownItem>
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

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir card">
        <p className="text-sm text-[--muted] mb-4">
          Tem certeza que deseja excluir este card?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={async () => { await runServerAction(() => deleteCard(card.id)); setConfirmDelete(false) }}>Excluir</Button>
        </div>
      </Dialog>
    </>
  )
})
