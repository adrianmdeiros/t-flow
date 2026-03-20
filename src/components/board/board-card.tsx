'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Trash2, Loader2 } from 'lucide-react'
import { deleteBoard } from '@/actions/boards'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { Board } from '@/types'

interface BoardCardProps {
  board: Board
}

export function BoardCard({ board }: BoardCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <>
      <div className="relative group">
        <Link href={`/board/${board.id}`} className="block">
          <Card className="hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="truncate">{board.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">
                {new Date(board.createdAt).toLocaleDateString('pt-BR')}
              </Badge>
            </CardContent>
          </Card>
        </Link>

        <div className="absolute top-2 right-2 sm:hidden sm:group-hover:block has-data-[state=open]:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 w-7 flex items-center justify-center bg-background/80 hover:bg-background border border-border shadow-sm cursor-pointer rounded-md">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir quadro
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir quadro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o quadro &ldquo;{board.title}&rdquo;? Todas as colunas e cards serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={async (e) => {
                e.preventDefault()
                setDeleting(true)
                const result = await deleteBoard(board.id)
                if (result.success) {
                  toast.success('Quadro excluído')
                } else {
                  toast.error(result.error)
                  setDeleting(false)
                }
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
