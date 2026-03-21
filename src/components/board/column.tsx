'use client'

import { memo, useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, Eraser, Trash2, Loader2 } from 'lucide-react'
import { deleteColumn, updateColumnTitle, clearColumn } from '@/actions/columns'
import { Card } from './card'
import { useBoardContext } from './board-context'
import { Button } from '@/components/ui/button'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { ColumnWithCards } from '@/types'

const SIZE_ORDER = { small: 0, medium: 1, large: 2 } as const
const COLUMN_WIDTH: Record<string, string> = {
  small: 'w-48',
  medium: 'w-56',
  large: 'w-64',
}

function getColumnWidth(cards: ColumnWithCards['cards']): string {
  if (cards.length === 0) return 'w-56'
  let max: keyof typeof SIZE_ORDER = 'small'
  for (const card of cards) {
    const size = (card.imageSize ?? 'large') as keyof typeof SIZE_ORDER
    if (SIZE_ORDER[size] > SIZE_ORDER[max]) max = size
  }
  return COLUMN_WIDTH[max]
}

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
  const [deletingCol, setDeletingCol] = useState(false)
  const [clearingCol, setClearingCol] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `column:${column.id}` })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const cardIds = column.cards.map((c) => `card:${c.id}`)
  const widthClass = getColumnWidth(column.cards)

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
        {...attributes}
        {...listeners}
        style={style}
        className={`${widthClass} shrink-0 bg-accent border border-border flex flex-col h-full cursor-grab active:cursor-grabbing`}
      >
        <div className="flex items-center gap-1 p-3">
          {editing ? (
            <input
              className="flex-1 bg-transparent text-sm font-semibold border-b border-primary outline-none"
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-6 w-6 flex items-center justify-center bg-accent hover:bg-background shadow-sm cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" collisionPadding={8}>
              <DropdownMenuItem onPointerDown={(e) => e.stopPropagation()} onSelect={() => setConfirmClear(true)}>
                <Eraser className="h-4 w-4" />
                Limpar coluna
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onPointerDown={(e) => e.stopPropagation()} onSelect={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
                Excluir coluna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator />

        <ScrollArea className="flex-1 min-h-16">
          <div className="p-2 space-y-2">
            <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
              {column.cards.map((card) => (
                <Card key={card.id} card={card} userId={userId} boardId={boardId} />
              ))}
            </SortableContext>
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coluna</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a coluna &ldquo;{column.title}&rdquo;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCol}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletingCol}
              onClick={async (e) => {
                e.preventDefault()
                setDeletingCol(true)
                await runServerAction(() => deleteColumn(column.id, boardId))
                toast.success('Coluna excluída')
                setDeletingCol(false)
                setConfirmDelete(false)
              }}
            >
              {deletingCol ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar coluna</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os cards serão movidos para a área de não atribuídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearingCol}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="warning"
              disabled={clearingCol}
              onClick={async (e) => {
                e.preventDefault()
                setClearingCol(true)
                await runServerAction(() => clearColumn(column.id, boardId))
                toast.success('Coluna limpa')
                setClearingCol(false)
                setConfirmClear(false)
              }}
            >
              {clearingCol ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Limpar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
