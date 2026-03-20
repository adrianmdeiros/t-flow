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

/** Authenticate + verify board ownership in parallel */
async function authenticateAndVerify(boardId: string): Promise<{ error: string } | { user: NonNullable<Awaited<ReturnType<typeof getUser>>>; board: typeof boards.$inferSelect }> {
  const [user, [board]] = await Promise.all([
    getUser(),
    db.select().from(boards).where(eq(boards.id, boardId)),
  ])
  if (!user) return { error: 'Unauthorized' }
  if (!board || board.ownerId !== user.id) return { error: 'Board not found' }
  return { user, board }
}

export async function createColumn(boardId: string, title: string): Promise<ActionResult<typeof columns.$inferSelect>> {
  const auth = await authenticateAndVerify(boardId)
  if ('error' in auth) return { success: false, error: auth.error }

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
  const auth = await authenticateAndVerify(boardId)
  if ('error' in auth) return { success: false, error: auth.error }

  await db.delete(columns).where(eq(columns.id, columnId))

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: null }
}

export async function updateColumnTitle(columnId: string, title: string, boardId: string): Promise<ActionResult<typeof columns.$inferSelect>> {
  const auth = await authenticateAndVerify(boardId)
  if ('error' in auth) return { success: false, error: auth.error }

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
  if (!orderedIds.length) return { success: true, data: null }

  const auth = await authenticateAndVerify(boardId)
  if ('error' in auth) return { success: false, error: auth.error }

  // Single SQL statement using CASE instead of N individual UPDATEs
  const cases = orderedIds
    .map((id, i) => sql`WHEN ${id} THEN ${sql.raw(String(i))}`)

  await db.execute(sql`
    UPDATE columns SET position = CASE id ${sql.join(cases, sql` `)} END
    WHERE id IN (${sql.join(orderedIds.map(id => sql`${id}`), sql`, `)})
  `)

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: null }
}

export async function clearColumn(columnId: string, boardId: string): Promise<ActionResult<null>> {
  const auth = await authenticateAndVerify(boardId)
  if ('error' in auth) return { success: false, error: auth.error }

  await db
    .update(cards)
    .set({ columnId: null })
    .where(eq(cards.columnId, columnId))

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: null }
}
