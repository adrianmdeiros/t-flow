'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { boards, cards } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq, and, isNull, max, sql } from 'drizzle-orm'

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

export async function removeStorageImages(paths: string[]) {
  const valid = paths.filter(Boolean)
  if (!valid.length) return
  const supabase = await createClient()
  await supabase.storage.from('card-images').remove(valid)
}

export async function createCard(
  boardId: string,
  opts: { title?: string | null; imageUrl?: string | null; columnId?: string | null; imageShape?: 'square' | 'round'; imageSize?: 'small' | 'medium' | 'large' }
): Promise<ActionResult<typeof cards.$inferSelect>> {
  const auth = await authenticateAndVerify(boardId)
  if ('error' in auth) return { success: false, error: auth.error }

  const posQuery = opts.columnId
    ? db.select({ maxPos: max(cards.position) }).from(cards).where(eq(cards.columnId, opts.columnId))
    : db.select({ maxPos: max(cards.position) }).from(cards).where(and(eq(cards.boardId, boardId), isNull(cards.columnId)))

  const [{ maxPos }] = await posQuery
  const position = (maxPos ?? -1) + 1

  const [card] = await db
    .insert(cards)
    .values({
      boardId,
      columnId: opts.columnId ?? null,
      title: opts.title ?? null,
      imageUrl: opts.imageUrl ?? null,
      imageShape: opts.imageShape ?? 'square',
      imageSize: opts.imageSize ?? 'large',
      position,
    })
    .returning()

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: card }
}

export async function updateCard(
  cardId: string,
  opts: { title?: string | null; imageUrl?: string | null; imageShape?: 'square' | 'round'; imageSize?: 'small' | 'medium' | 'large' }
): Promise<ActionResult<typeof cards.$inferSelect>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const [existing] = await db.select().from(cards).where(eq(cards.id, cardId))
  if (!existing) return { success: false, error: 'Card not found' }

  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, existing.boardId), eq(boards.ownerId, user.id)))
  if (!board) return { success: false, error: 'Unauthorized' }

  const updates: Partial<typeof cards.$inferInsert> = {}
  if (opts.title !== undefined) updates.title = opts.title
  if (opts.imageUrl !== undefined) updates.imageUrl = opts.imageUrl
  if (opts.imageShape !== undefined) updates.imageShape = opts.imageShape
  if (opts.imageSize !== undefined) updates.imageSize = opts.imageSize

  // Remove old image from storage when replacing with a new one or clearing it
  const [card] = await db
    .update(cards)
    .set(updates)
    .where(eq(cards.id, cardId))
    .returning()

  // Clean up old image in background (don't block response)
  if (opts.imageUrl !== undefined && existing.imageUrl && opts.imageUrl !== existing.imageUrl) {
    removeStorageImages([existing.imageUrl]).catch(() => {})
  }

  revalidatePath(`/board/${existing.boardId}`)
  return { success: true, data: card }
}

export async function duplicateCard(cardId: string): Promise<ActionResult<typeof cards.$inferSelect>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const [existing] = await db.select().from(cards).where(eq(cards.id, cardId))
  if (!existing) return { success: false, error: 'Card not found' }

  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, existing.boardId), eq(boards.ownerId, user.id)))
  if (!board) return { success: false, error: 'Unauthorized' }

  const newPosition = existing.position + 1

  // Shift all cards after the original in a single UPDATE instead of a loop
  const siblingsFilter = existing.columnId
    ? and(eq(cards.columnId, existing.columnId), eq(cards.boardId, existing.boardId))
    : and(isNull(cards.columnId), eq(cards.boardId, existing.boardId))

  await db
    .update(cards)
    .set({ position: sql`${cards.position} + 1` })
    .where(and(siblingsFilter, sql`${cards.position} >= ${newPosition}`))

  let duplicatedImageUrl = existing.imageUrl

  // Copy the image in storage if one exists
  if (existing.imageUrl) {
    const supabase = await createClient()
    const newPath = `${user.id}/${crypto.randomUUID()}_${Date.now()}.webp`
    const { error } = await supabase.storage
      .from('card-images')
      .copy(existing.imageUrl, newPath)
    if (!error) {
      duplicatedImageUrl = newPath
    }
  }

  const [card] = await db
    .insert(cards)
    .values({
      boardId: existing.boardId,
      columnId: existing.columnId,
      title: existing.title,
      imageUrl: duplicatedImageUrl,
      imageShape: existing.imageShape,
      imageSize: existing.imageSize,
      position: newPosition,
    })
    .returning()

  revalidatePath(`/board/${existing.boardId}`)
  return { success: true, data: card }
}

export async function deleteCard(cardId: string): Promise<ActionResult<null>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const [existing] = await db.select().from(cards).where(eq(cards.id, cardId))
  if (!existing) return { success: false, error: 'Card not found' }

  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, existing.boardId), eq(boards.ownerId, user.id)))
  if (!board) return { success: false, error: 'Unauthorized' }

  await db.delete(cards).where(eq(cards.id, cardId))

  // Clean up image in background
  if (existing.imageUrl) {
    removeStorageImages([existing.imageUrl]).catch(() => {})
  }

  revalidatePath(`/board/${existing.boardId}`)
  return { success: true, data: null }
}

export async function moveCard(
  cardId: string,
  newColumnId: string | null,
  newPosition: number
): Promise<ActionResult<null>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const [existing] = await db.select().from(cards).where(eq(cards.id, cardId))
  if (!existing) return { success: false, error: 'Card not found' }

  const [board] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, existing.boardId), eq(boards.ownerId, user.id)))
  if (!board) return { success: false, error: 'Unauthorized' }

  await db.transaction(async (tx) => {
    // Move card
    await tx
      .update(cards)
      .set({ columnId: newColumnId, position: newPosition })
      .where(eq(cards.id, cardId))

    // Re-index destination column with a single SQL statement
    const destFilter = newColumnId
      ? and(eq(cards.columnId, newColumnId), eq(cards.boardId, existing.boardId))
      : and(isNull(cards.columnId), eq(cards.boardId, existing.boardId))

    // Use a subquery-based approach: assign row_number as position
    await tx.execute(sql`
      UPDATE cards SET position = sub.rn
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY position) - 1 AS rn
        FROM cards
        WHERE ${destFilter}
      ) sub
      WHERE cards.id = sub.id
    `)
  })

  revalidatePath(`/board/${existing.boardId}`)
  return { success: true, data: null }
}

export async function reorderCards(
  boardId: string,
  columnId: string | null,
  orderedIds: string[]
): Promise<ActionResult<null>> {
  if (!orderedIds.length) return { success: true, data: null }

  const auth = await authenticateAndVerify(boardId)
  if ('error' in auth) return { success: false, error: auth.error }

  // Single SQL statement using CASE instead of N individual UPDATEs
  const cases = orderedIds
    .map((id, i) => sql`WHEN ${id} THEN ${sql.raw(String(i))}`)

  await db.execute(sql`
    UPDATE cards SET position = CASE id ${sql.join(cases, sql` `)} END
    WHERE id IN (${sql.join(orderedIds.map(id => sql`${id}`), sql`, `)})
  `)

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: null }
}
