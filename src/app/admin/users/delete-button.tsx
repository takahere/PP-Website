'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteUser } from './actions'

interface DeleteUserButtonProps {
  userId: string
  email: string
}

export function DeleteUserButton({ userId, email }: DeleteUserButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error || 'エラーが発生しました')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ユーザーを削除</DialogTitle>
          <DialogDescription>
            「{email}」を削除しますか？この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            削除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
