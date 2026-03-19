'use client'

import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react'

type BoardContextValue = {
  /** Wrap any server action so revalidatePath won't overwrite optimistic state */
  runServerAction: (action: () => Promise<unknown>) => Promise<void>
}

const BoardContext = createContext<BoardContextValue | null>(null)

export function useBoardContext() {
  const ctx = useContext(BoardContext)
  if (!ctx) throw new Error('useBoardContext must be used within BoardProvider')
  return ctx
}

export function BoardProvider({
  children,
  pendingRef,
}: {
  children: ReactNode
  pendingRef: React.RefObject<number>
}) {
  const runServerAction = useCallback(async (action: () => Promise<unknown>) => {
    pendingRef.current!++
    try {
      await action()
    } finally {
      pendingRef.current!--
    }
  }, [pendingRef])

  return (
    <BoardContext.Provider value={{ runServerAction }}>
      {children}
    </BoardContext.Provider>
  )
}
