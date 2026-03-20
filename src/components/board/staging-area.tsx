'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Card } from './card'
import { CardForm } from './card-form'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Plus } from 'lucide-react'
import type { Card as CardType } from '@/types'

const CARD_WIDTH: Record<string, string> = {
  small: 'w-48',
  medium: 'w-56',
  large: 'w-56',
}

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
      className={`min-h-20 border-2 border-dashed transition-colors ${
        isOver
          ? 'border-primary bg-primary/10'
          : 'border-transparent'
      }`}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-3 items-center p-2 sm:p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setAddOpen(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 border-2 border-dashed border-border hover:border-primary hover:bg-accent transition-colors flex items-center justify-center cursor-pointer"
              >
                <Plus className="h-8 w-8 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Adicionar card</TooltipContent>
          </Tooltip>

          <SortableContext items={cardIds} strategy={horizontalListSortingStrategy}>
            {cards.map((card) => (
              <div key={card.id} className={`${CARD_WIDTH[card.imageSize] ?? 'w-56'} shrink-0`}>
                <Card card={card} userId={userId} boardId={boardId} />
              </div>
            ))}
          </SortableContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

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
