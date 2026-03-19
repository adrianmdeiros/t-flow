'use client'

import { memo, useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, Eraser, Trash2 } from 'lucide-react'
import { deleteColumn, updateColumnTitle, clearColumn } from '@/actions/columns'
import { Card } from './card'
import { useBoardContext } from './board-context'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { DropdownMenu, DropdownItem } from '@/components/ui/dropdown-menu'
import type { ColumnWithCards } from '@/types'

interface ColumnProps {
  column: ColumnWithCards
  boardId: string
  userId: string
}

export const Column = memo(function Column({ column, boardId, userId }: ColumnProps) {
  const { runServerAction } = useBoardContext()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(column.title)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `column:${column.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const cardIds = column.cards.map((c) => `card:${c.id}`)

  const saveTitle = async () => {
    setEditing(false)
    if (title.trim() && title.trim() !== column.title) {
      await runServerAction(() => updateColumnTitle(column.id, title.trim(), boardId))
    } else {
      setTitle(column.title)
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="w-64 shrink-0 rounded-lg bg-[--accent] border border-[--border] flex flex-col h-full cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-1 p-3 border-b border-[--border]">
          {editing ? (
            <input
              className="flex-1 bg-transparent text-sm font-semibold border-b border-[--primary] outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle()
                if (e.key === 'Escape') { setTitle(column.title); setEditing(false) }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <h3
              className="flex-1 text-sm font-semibold cursor-pointer"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setEditing(true)}
            >
              {title}
            </h3>
          )}

          <DropdownMenu
            trigger={
              <span className="h-6 w-6 flex items-center justify-center rounded bg-[--accent] hover:bg-[--background] shadow-sm">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            }
          >
            <DropdownItem
              icon={<Eraser className="h-4 w-4" />}
              onClick={() => setConfirmClear(true)}
            >
              Limpar coluna
            </DropdownItem>
            <DropdownItem
              icon={<Trash2 className="h-4 w-4" />}
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Excluir coluna
            </DropdownItem>
          </DropdownMenu>
        </div>

        <div className="p-2 space-y-2 flex-1 min-h-16 overflow-y-auto">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {column.cards.map((card) => (
              <Card key={card.id} card={card} userId={userId} boardId={boardId} />
            ))}
          </SortableContext>
        </div>
      </div>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir coluna">
        <p className="text-sm text-[--muted] mb-4">
          Tem certeza que deseja excluir a coluna &ldquo;{column.title}&rdquo;?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={async () => { await runServerAction(() => deleteColumn(column.id, boardId)); setConfirmDelete(false) }}>Excluir</Button>
        </div>
      </Dialog>

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} title="Limpar coluna">
        <p className="text-sm text-[--muted] mb-4">
          Todos os cards serão movidos para a área de não atribuídos.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>Cancelar</Button>
          <Button variant="warning" onClick={async () => { await runServerAction(() => clearColumn(column.id, boardId)); setConfirmClear(false) }}>Limpar</Button>
        </div>
      </Dialog>
    </>
  )
})
