'use client'

import { useState, useRef, useEffect } from 'react'
import { updateBoardTitle } from '@/actions/boards'
import type { Board } from '@/types'

interface BoardHeaderProps {
  board: Board
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(board.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const save = async () => {
    setEditing(false)
    if (title.trim() && title.trim() !== board.title) {
      await updateBoardTitle(board.id, title.trim())
    } else {
      setTitle(board.title)
    }
  }

  return editing ? (
    <input
      ref={inputRef}
      className="text-2xl font-bold bg-transparent border-b border-[--primary] outline-none text-[--foreground]"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === 'Enter') save()
        if (e.key === 'Escape') {
          setTitle(board.title)
          setEditing(false)
        }
      }}
    />
  ) : (
    <h1
      className="text-2xl font-bold cursor-pointer hover:opacity-70 transition-opacity"
      onClick={() => setEditing(true)}
      title="Click to rename"
    >
      {title}
    </h1>
  )
}
