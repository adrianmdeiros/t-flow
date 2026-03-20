'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { boards, cards, columns } from '@/db/schema'
import { createBoardSchema, updateBoardSchema } from '@/db/validations'
import { createClient } from '@/lib/supabase/server'
import { removeStorageImages } from '@/actions/cards'
import { eq, and } from 'drizzle-orm'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function createBoard(formData: FormData): Promise<ActionResult<typeof boards.$inferSelect>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = createBoardSchema.safeParse({ title: formData.get('title') })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const [board] = await db
    .insert(boards)
    .values({ ownerId: user.id, title: parsed.data.title })
    .returning()

  // Insert all default columns in a single query
  const defaults = ['A fazer', 'Em andamento', 'Concluído']
  await db.insert(columns).values(
    defaults.map((title, i) => ({ boardId: board.id, title, position: i }))
  )

  revalidatePath('/')
  return { success: true, data: board }
}

export async function deleteBoard(boardId: string): Promise<ActionResult<null>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Remove all card images from storage before deleting the board
  const boardCards = await db
    .select({ imageUrl: cards.imageUrl })
    .from(cards)
    .where(eq(cards.boardId, boardId))
  const imagePaths = boardCards.map((c) => c.imageUrl).filter((url): url is string => !!url)

  const result = await db
    .delete(boards)
    .where(and(eq(boards.id, boardId), eq(boards.ownerId, user.id)))
    .returning()

  if (!result.length) return { success: false, error: 'Board not found' }

  // Clean up images in background after the board is deleted
  if (imagePaths.length) {
    removeStorageImages(imagePaths).catch(() => {})
  }

  revalidatePath('/')
  return { success: true, data: null }
}

export async function updateBoardTitle(boardId: string, title: string): Promise<ActionResult<typeof boards.$inferSelect>> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const parsed = updateBoardSchema.safeParse({ title })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const [board] = await db
    .update(boards)
    .set({ title: parsed.data.title, updatedAt: new Date() })
    .where(and(eq(boards.id, boardId), eq(boards.ownerId, user.id)))
    .returning()

  if (!board) return { success: false, error: 'Board not found' }

  revalidatePath(`/board/${boardId}`)
  return { success: true, data: board }
}
