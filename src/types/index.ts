import type { InferSelectModel } from 'drizzle-orm'
import type { boards, columns, cards, users } from '@/db/schema'

export type User = InferSelectModel<typeof users>
export type Board = InferSelectModel<typeof boards>
export type Column = InferSelectModel<typeof columns>
export type Card = InferSelectModel<typeof cards>

export type BoardWithRelations = Board & {
  columns: ColumnWithCards[]
}

export type ColumnWithCards = Column & {
  cards: Card[]
}
