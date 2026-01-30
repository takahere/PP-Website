'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createRedirect } from '@/app/admin/redirects/actions'

export function NewRedirectDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    from_path: '',
    to_path: '',
    is_permanent: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = () => {
    setError(null)

    if (!formData.from_path || !formData.to_path) {
      setError('元のパスと転送先は必須です')
      return
    }

    startTransition(async () => {
      const result = await createRedirect(formData)
      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error || '作成に失敗しました')
      }
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // ダイアログを閉じるときにフォームをリセット
      setFormData({
        from_path: '',
        to_path: '',
        is_permanent: true,
      })
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          新規追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>リダイレクトを追加</DialogTitle>
          <DialogDescription>
            リダイレクト元と転送先のパスを入力してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="from_path">元のパス *</Label>
            <Input
              id="from_path"
              name="from_path"
              value={formData.from_path}
              onChange={handleChange}
              placeholder="/old-page"
            />
            <p className="text-xs text-muted-foreground">
              リダイレクト元のURL（例: /blog/old-post）
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to_path">転送先パス *</Label>
            <Input
              id="to_path"
              name="to_path"
              value={formData.to_path}
              onChange={handleChange}
              placeholder="/new-page"
            />
            <p className="text-xs text-muted-foreground">
              リダイレクト先のURL（例: /news/new-post）
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is_permanent">301（恒久的リダイレクト）</Label>
              <p className="text-xs text-muted-foreground">
                オフの場合は302（一時的リダイレクト）になります
              </p>
            </div>
            <Switch
              id="is_permanent"
              checked={formData.is_permanent}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_permanent: checked }))
              }
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !formData.from_path || !formData.to_path}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
