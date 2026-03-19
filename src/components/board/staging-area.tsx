'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Card } from './card'
import { CardForm } from './card-form'
import { Plus } from 'lucide-react'
import type { Card as CardType } from '@/types'

interface StagingAreaProps {
  cards: CardType[]
  boardId: string
  userId: string
}

export function StagingArea({ cards, boardId, userId }: StagingAreaProps) {
  const [addOpen, setAddOpen] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: 'staging' })

  const cardIds = cards.map((c) => `card:${c.id}`)

  return (
    <div
      ref={setNodeRef}
      className={`flex gap-3 items-center overflow-x-auto p-3 min-h-20 rounded-lg border-2 border-dashed transition-colors ${
        isOver
          ? 'border-[--primary] bg-[--primary]/10'
          : 'border-transparent'
      }`}
    >
      <SortableContext items={cardIds} strategy={horizontalListSortingStrategy}>
        {cards.map((card) => (
          <div key={card.id} className="w-56 shrink-0">
            <Card card={card} userId={userId} boardId={boardId} />
          </div>
        ))}
      </SortableContext>

      <button
        onClick={() => setAddOpen(true)}
        className="w-20 h-20 shrink-0 rounded-xl border-2 border-dashed border-[--border] hover:border-[--primary] hover:bg-[--accent] transition-colors flex items-center justify-center cursor-pointer"
      >
        <Plus className="h-8 w-8 text-[--muted]" />
      </button>

      <CardForm
        boardId={boardId}
        columnId={null}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        userId={userId}
      />
    </div>
  )
}
