'use client'

import { useState, useTransition } from 'react'
import { UserPlus, Loader2, Mail, Key } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createUser } from './actions'

export function InviteUserDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await createUser(email, password || undefined)
      if (result.success) {
        if (result.method === 'created') {
          setSuccess('ユーザーを作成しました。パスワードを本人に伝えてください。')
        } else {
          setSuccess('招待メールを送信しました。')
        }
        setEmail('')
        setPassword('')
        // Close dialog after a short delay
        setTimeout(() => {
          setOpen(false)
          setSuccess(null)
        }, 2000)
      } else {
        setError(result.error || 'エラーが発生しました')
      }
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setEmail('')
      setPassword('')
      setError(null)
      setSuccess(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          ユーザーを追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいユーザーを追加</DialogTitle>
          <DialogDescription>
            パスワードを入力すると直接作成、空欄の場合は招待メールを送信します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード <span className="text-gray-400 text-xs">（任意）</span>
            </label>
            <Input
              type="password"
              placeholder="空欄の場合は招待メールを送信"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              6文字以上で入力してください
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600">{success}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !email || (password.length > 0 && password.length < 6)}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : password ? (
              <Key className="mr-2 h-4 w-4" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            {password ? 'ユーザーを作成' : '招待メールを送信'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
