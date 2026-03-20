'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  DndContext,
  pointerWithin,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

// PointerSensor that ignores touch events so TouchSensor handles them with delay-based activation
class MouseOnlySensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
        return nativeEvent.pointerType !== 'touch'
      },
    },
  ]
}
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { Column } from './column'
import { StagingArea } from './staging-area'
import { ColumnForm } from './column-form'
import { CardOverlay } from './card-overlay'
import { BoardProvider } from './board-context'
import { reorderColumns } from '@/actions/columns'
import { moveCard, reorderCards } from '@/actions/cards'
import type { Card, ColumnWithCards } from '@/types'

const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args)
  if (pointer.length > 0) return pointer
  return closestCenter(args)
}

interface BoardViewProps {
  boardId: string
  columns: ColumnWithCards[]
  stagingCards: Card[]
  userId: string
}

type BoardState = {
  columns: ColumnWithCards[]
  stagingCards: Card[]
}

// Helpers to resolve destination from an over ID
function resolveDestination(overId: string, state: BoardState) {
  if (overId === 'staging') return { columnId: null, isStaging: true }
  if (overId.startsWith('column:')) return { columnId: overId.replace('column:', ''), isStaging: false }
  if (overId.startsWith('card:')) {
    const overCardId = overId.replace('card:', '')
    const col = state.columns.find((c) => c.cards.some((card) => card.id === overCardId))
    if (col) return { columnId: col.id, isStaging: false }
    return { columnId: null, isStaging: true }
  }
  return null
}

function findCardSource(cardId: string, state: BoardState) {
  const colIndex = state.columns.findIndex((c) => c.cards.some((card) => card.id === cardId))
  if (colIndex !== -1) return { columnId: state.columns[colIndex].id, isStaging: false, colIndex }
  return { columnId: null, isStaging: true, colIndex: -1 }
}

function applyCardMove(state: BoardState, cardId: string, destColumnId: string | null, destIsStaging: boolean, overCardId?: string): BoardState {
  // Find and remove card from source
  let movingCard: Card | undefined
  const newCols = state.columns.map((col) => {
    const card = col.cards.find((c) => c.id === cardId)
    if (card) movingCard = { ...card, columnId: destColumnId }
    return { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
  })
  let newStaging = state.stagingCards.filter((c) => c.id !== cardId)
  if (!movingCard) {
    const card = state.stagingCards.find((c) => c.id === cardId)
    if (card) movingCard = { ...card, columnId: destColumnId }
  }
  if (!movingCard) return state

  // Insert into destination
  if (destIsStaging) {
    if (overCardId) {
      const idx = newStaging.findIndex((c) => c.id === overCardId)
      if (idx !== -1) {
        newStaging.splice(idx, 0, movingCard)
      } else {
        newStaging.push(movingCard)
      }
    } else {
      newStaging.push(movingCard)
    }
  } else {
    return {
      columns: newCols.map((col) => {
        if (col.id !== destColumnId) return col
        const cards = [...col.cards]
        if (overCardId) {
          const idx = cards.findIndex((c) => c.id === overCardId)
          if (idx !== -1) {
            cards.splice(idx, 0, movingCard!)
          } else {
            cards.push(movingCard!)
          }
        } else {
          cards.push(movingCard!)
        }
        return { ...col, cards }
      }),
      stagingCards: newStaging,
    }
  }
  return { columns: newCols, stagingCards: newStaging }
}

export function BoardView({ boardId, columns: initialColumns, stagingCards: initialStaging, userId }: BoardViewProps) {
  const [boardState, setBoardState] = useState<BoardState>({ columns: initialColumns, stagingCards: initialStaging })
  const stateRef = useRef<BoardState>({ columns: initialColumns, stagingCards: initialStaging })
  const snapshotRef = useRef<BoardState | null>(null)
  const pendingRef = useRef(0)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const serverPropsRef = useRef({ columns: initialColumns, stagingCards: initialStaging })
  serverPropsRef.current = { columns: initialColumns, stagingCards: initialStaging }

  useEffect(() => {
    if (snapshotRef.current || pendingRef.current > 0) return
    // Light comparison: check column/card IDs and order instead of full JSON
    setBoardState((prev) => {
      const next = { columns: initialColumns, stagingCards: initialStaging }
      stateRef.current = next
      return next
    })
  }, [initialColumns, initialStaging])

  const updateState = useCallback((next: BoardState) => {
    stateRef.current = next
    setBoardState(next)
  }, [])

  const runServerAction = useCallback(async (action: () => Promise<unknown>) => {
    pendingRef.current++
    try {
      await action()
    } finally {
      pendingRef.current--
    }
  }, [])

  const sensors = useSensors(
    useSensor(MouseOnlySensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  // No handleDragOver — all mutation happens in handleDragEnd
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = String(event.active.id)
    snapshotRef.current = stateRef.current
    if (activeId.startsWith('card:')) {
      setActiveCardId(activeId.replace('card:', ''))
    }
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    const snapshot = snapshotRef.current
    snapshotRef.current = null
    setActiveCardId(null)

    if (!over || active.id === over.id) return
    if (!snapshot) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Column reorder
    if (activeId.startsWith('column:') && overId.startsWith('column:')) {
      const activeColId = activeId.replace('column:', '')
      const overColId = overId.replace('column:', '')
      const oldIndex = snapshot.columns.findIndex((c) => c.id === activeColId)
      const newIndex = snapshot.columns.findIndex((c) => c.id === overColId)
      if (oldIndex === -1 || newIndex === -1) return
      const newCols = arrayMove(snapshot.columns, oldIndex, newIndex).map((c, i) => ({ ...c, position: i }))
      const next = { ...snapshot, columns: newCols }
      updateState(next)
      await runServerAction(() => reorderColumns(boardId, newCols.map((c) => c.id)))
      return
    }

    // Card operations
    if (!activeId.startsWith('card:')) return
    const cardId = activeId.replace('card:', '')
    const source = findCardSource(cardId, snapshot)
    const dest = resolveDestination(overId, snapshot)
    if (!dest) return

    const isSameContainer =
      (source.isStaging && dest.isStaging) ||
      (!source.isStaging && !dest.isStaging && source.columnId === dest.columnId)

    if (!isSameContainer) {
      // Cross-container move: apply optimistic state, then persist
      const overCardId = overId.startsWith('card:') ? overId.replace('card:', '') : undefined
      const next = applyCardMove(snapshot, cardId, dest.columnId, dest.isStaging, overCardId)
      updateState(next)

      // Calculate position for server
      let newPosition = 0
      if (dest.isStaging) {
        const idx = next.stagingCards.findIndex((c) => c.id === cardId)
        newPosition = idx >= 0 ? idx : next.stagingCards.length - 1
      } else {
        const destCol = next.columns.find((c) => c.id === dest.columnId)
        const idx = destCol?.cards.findIndex((c) => c.id === cardId) ?? -1
        newPosition = idx >= 0 ? idx : (destCol?.cards.length ?? 1) - 1
      }
      await runServerAction(() => moveCard(cardId, dest.columnId, newPosition))
      return
    }

    // Same-container reorder
    if (!source.isStaging && !dest.isStaging && source.columnId === dest.columnId) {
      const col = snapshot.columns[source.colIndex]
      const overCardId = overId.replace('card:', '')
      const oldIdx = col.cards.findIndex((c) => c.id === cardId)
      const newIdx = col.cards.findIndex((c) => c.id === overCardId)
      if (oldIdx === -1 || newIdx === -1) return
      const newCards = arrayMove(col.cards, oldIdx, newIdx)
      const next = {
        ...snapshot,
        columns: snapshot.columns.map((c, i) => i === source.colIndex ? { ...c, cards: newCards } : c),
      }
      updateState(next)
      await runServerAction(() => reorderCards(boardId, source.columnId, newCards.map((c) => c.id)))
      return
    }

    // Staging reorder
    if (source.isStaging && dest.isStaging) {
      const overCardId = overId.replace('card:', '')
      const oldIdx = snapshot.stagingCards.findIndex((c) => c.id === cardId)
      const newIdx = snapshot.stagingCards.findIndex((c) => c.id === overCardId)
      if (oldIdx === -1 || newIdx === -1) return
      const newStaging = arrayMove(snapshot.stagingCards, oldIdx, newIdx)
      updateState({ ...snapshot, stagingCards: newStaging })
      await runServerAction(() => reorderCards(boardId, null, newStaging.map((c) => c.id)))
    }
  }, [boardId, updateState, runServerAction])

  const handleDragCancel = useCallback(() => {
    if (snapshotRef.current) {
      updateState(snapshotRef.current)
      snapshotRef.current = null
    }
    setActiveCardId(null)
  }, [updateState])

  const columnIds = useMemo(() => boardState.columns.map((c) => `column:${c.id}`), [boardState.columns])

  const activeCard = useMemo(() => {
    if (!activeCardId) return null
    for (const col of stateRef.current.columns) {
      const card = col.cards.find((c) => c.id === activeCardId)
      if (card) return card
    }
    return stateRef.current.stagingCards.find((c) => c.id === activeCardId) ?? null
  }, [activeCardId])

  return (
    <BoardProvider pendingRef={pendingRef}>
      <DndContext
        id="board-dnd"
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-col p-2 sm:p-4 h-[calc(100dvh-120px)]">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 flex-1 min-h-0">
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {boardState.columns.map((col) => (
                <Column key={col.id} column={col} boardId={boardId} userId={userId} />
              ))}
            </SortableContext>
            <ColumnForm boardId={boardId} />
          </div>
          <StagingArea
            cards={boardState.stagingCards}
            boardId={boardId}
            userId={userId}
          />
        </div>
        <DragOverlay dropAnimation={null}>
          {activeCard ? <CardOverlay card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>
    </BoardProvider>
  )
}
