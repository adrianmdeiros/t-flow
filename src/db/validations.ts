import { z } from 'zod'

export const createBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
})

export const updateBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
})

export const createColumnSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  boardId: z.string().uuid(),
})

export const updateColumnSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
})

export const reorderColumnsSchema = z.object({
  boardId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()),
})

export const createCardSchema = z.object({
  boardId: z.string().uuid(),
  columnId: z.string().uuid().nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  imageShape: z.enum(['square', 'round']).optional(),
  imageSize: z.enum(['small', 'medium', 'large']).optional(),
})

export const updateCardSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  imageShape: z.enum(['square', 'round']).optional(),
  imageSize: z.enum(['small', 'medium', 'large']).optional(),
})

export const moveCardSchema = z.object({
  cardId: z.string().uuid(),
  newColumnId: z.string().uuid().nullable(),
  newPosition: z.number().int().min(0),
})

export const reorderCardsSchema = z.object({
  columnId: z.string().uuid().nullable(),
  orderedIds: z.array(z.string().uuid()),
})
