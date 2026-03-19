import Link from 'next/link'
import type { Board } from '@/types'

interface BoardCardProps {
  board: Board
}

export function BoardCard({ board }: BoardCardProps) {
  return (
    <Link
      href={`/board/${board.id}`}
      className="block rounded-lg border border-[--border] bg-[--card] p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-[--card-foreground] truncate">{board.title}</h3>
      <p className="text-xs text-[--muted] mt-1">
        Criado em {new Date(board.createdAt).toLocaleDateString('pt-BR')}
      </p>
    </Link>
  )
}
