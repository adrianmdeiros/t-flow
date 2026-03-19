'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { boards, cards } from '@/db/schema'
import { updateCardSchema } from '@/db/validations'
import { createClient } from '@/lib/supabase/server'
import { eq, and, isNull, max } from 'drizzle-orm'

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

export async function createCard(
  boardId: string,
  opts: { title?: string | null; imageUrl?: string | null; columnId?: string | null; imageShape?: 'square' | 'round' }
): Promise<ActionResult<typeof cards.$inferSelect>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const board = await verifyBoardOwner(boardId, user.id)
  if (!board) return { success: false, error: 'Board not found' }

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
      position,
    })
    .returning()

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: card }
}

export async function updateCard(
  cardId: string,
  opts: { title?: string | null; imageUrl?: string | null; imageShape?: 'square' | 'round' }
): Promise<ActionResult<typeof cards.$inferSelect>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const [existing] = await db.select().from(cards).where(eq(cards.id, cardId))
  if (!existing) return { success: false, error: 'Card not found' }

  const board = await verifyBoardOwner(existing.boardId, user.id)
  if (!board) return { success: false, error: 'Unauthorized' }

  const updates: Partial<typeof cards.$inferInsert> = {}
  if (opts.title !== undefined) updates.title = opts.title
  if (opts.imageUrl !== undefined) updates.imageUrl = opts.imageUrl
  if (opts.imageShape !== undefined) updates.imageShape = opts.imageShape

  const [card] = await db
    .update(cards)
    .set(updates)
    .where(eq(cards.id, cardId))
    .returning()

  revalidatePath(`/board/${existing.boardId}`)
  return { success: true, data: card }
}

export async function deleteCard(cardId: string): Promise<ActionResult<null>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const [existing] = await db.select().from(cards).where(eq(cards.id, cardId))
  if (!existing) return { success: false, error: 'Card not found' }

  const board = await verifyBoardOwner(existing.boardId, user.id)
  if (!board) return { success: false, error: 'Unauthorized' }

  await db.delete(cards).where(eq(cards.id, cardId))

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

  const board = await verifyBoardOwner(existing.boardId, user.id)
  if (!board) return { success: false, error: 'Unauthorized' }

  await db.transaction(async (tx) => {
    // Move card
    await tx
      .update(cards)
      .set({ columnId: newColumnId, position: newPosition })
      .where(eq(cards.id, cardId))

    // Re-index destination column (compact positions)
    const destCards = await tx
      .select({ id: cards.id })
      .from(cards)
      .where(
        newColumnId
          ? and(eq(cards.columnId, newColumnId), eq(cards.boardId, existing.boardId))
          : and(isNull(cards.columnId), eq(cards.boardId, existing.boardId))
      )
      .orderBy(cards.position)

    for (let i = 0; i < destCards.length; i++) {
      await tx.update(cards).set({ position: i }).where(eq(cards.id, destCards[i].id))
    }
  })

  revalidatePath(`/board/${existing.boardId}`)
  return { success: true, data: null }
}

export async function reorderCards(
  boardId: string,
  columnId: string | null,
  orderedIds: string[]
): Promise<ActionResult<null>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const board = await verifyBoardOwner(boardId, user.id)
  if (!board) return { success: false, error: 'Board not found' }

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(cards)
        .set({ position: i })
        .where(eq(cards.id, orderedIds[i]))
    }
  })

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: null }
}
