import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { boards } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { BoardCard } from '@/components/board/board-card'
import { NewBoardButton } from '@/components/board/new-board-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const userBoards = await db
    .select()
    .from(boards)
    .where(eq(boards.ownerId, user.id))
    .orderBy(desc(boards.updatedAt))

  return (
    <main className="px-3 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Meus quadros</h2>
        <NewBoardButton />
      </div>

      {userBoards.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Nenhum quadro ainda.</p>
          <p className="text-sm mt-1">Crie seu primeiro quadro para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {userBoards.map((board, i) => (
            <div
              key={board.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${i * 75}ms`, animationFillMode: 'backwards' }}
            >
              <BoardCard board={board} />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
