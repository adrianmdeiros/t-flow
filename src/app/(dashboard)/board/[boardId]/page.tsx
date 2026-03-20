import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { boards, columns, cards } from '@/db/schema'
import { and, eq, isNull, asc } from 'drizzle-orm'
import { BoardHeader } from '@/components/board/board-header'
import { BoardView } from '@/components/board/board-view'
import type { ColumnWithCards } from '@/types'

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.ownerId, user.id)))

  if (!board) notFound()

  const boardColumns = await db
    .select()
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(asc(columns.position))

  const boardCards = await db
    .select()
    .from(cards)
    .where(eq(cards.boardId, boardId))
    .orderBy(asc(cards.position))

  const stagingCards = boardCards.filter((c) => c.columnId === null)

  const columnsWithCards: ColumnWithCards[] = boardColumns.map((col) => ({
    ...col,
    cards: boardCards.filter((c) => c.columnId === col.id),
  }))

  return (
    <main className="flex flex-col min-h-[calc(100dvh-56px)]">
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
        <BoardHeader board={board} />
      </div>

      <BoardView
        boardId={boardId}
        columns={columnsWithCards}
        stagingCards={stagingCards}
        userId={user.id}
      />
    </main>
  )
}
