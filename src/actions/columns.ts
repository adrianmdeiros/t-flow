'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { boards, columns, cards } from '@/db/schema'
import { updateColumnSchema } from '@/db/validations'
import { createClient } from '@/lib/supabase/server'
import { eq, and, max, sql } from 'drizzle-orm'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function verifyBoardOwner(boardId: string, userId: string) {
  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.ownerId, userId)))
  return board
}

export async function createColumn(boardId: string, title: string): Promise<ActionResult<typeof columns.$inferSelect>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const board = await verifyBoardOwner(boardId, user.id)
  if (!board) return { success: false, error: 'Board not found' }

  const parsed = updateColumnSchema.safeParse({ title })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const [{ maxPos }] = await db
    .select({ maxPos: max(columns.position) })
    .from(columns)
    .where(eq(columns.boardId, boardId))

  const position = (maxPos ?? -1) + 1

  const [column] = await db
    .insert(columns)
    .values({ boardId, title: parsed.data.title, position })
    .returning()

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: column }
}

export async function deleteColumn(columnId: string, boardId: string): Promise<ActionResult<null>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const board = await verifyBoardOwner(boardId, user.id)
  if (!board) return { success: false, error: 'Board not found' }

  await db.delete(columns).where(eq(columns.id, columnId))

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: null }
}

export async function updateColumnTitle(columnId: string, title: string, boardId: string): Promise<ActionResult<typeof columns.$inferSelect>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const board = await verifyBoardOwner(boardId, user.id)
  if (!board) return { success: false, error: 'Board not found' }

  const parsed = updateColumnSchema.safeParse({ title })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const [column] = await db
    .update(columns)
    .set({ title: parsed.data.title, updatedAt: new Date() })
    .where(eq(columns.id, columnId))
    .returning()

  if (!column) return { success: false, error: 'Column not found' }

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: column }
}

export async function reorderColumns(boardId: string, orderedIds: string[]): Promise<ActionResult<null>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const board = await verifyBoardOwner(boardId, user.id)
  if (!board) return { success: false, error: 'Board not found' }

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(columns)
        .set({ position: i })
        .where(and(eq(columns.id, orderedIds[i]), eq(columns.boardId, boardId)))
    }
  })

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: null }
}

export async function clearColumn(columnId: string, boardId: string): Promise<ActionResult<null>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const board = await verifyBoardOwner(boardId, user.id)
  if (!board) return { success: false, error: 'Board not found' }

  await db
    .update(cards)
    .set({ columnId: null })
    .where(eq(cards.columnId, columnId))

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: null }
}
