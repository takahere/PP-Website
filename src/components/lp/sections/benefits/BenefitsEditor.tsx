'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SectionEditorProps } from '../../core/types'
import type { BenefitsContent, BenefitItem } from './types'
import { benefitsVariants } from './config'

/**
 * メリットセクションエディタ
 */
export function BenefitsEditor({
  content,
  onChange,
}: SectionEditorProps<BenefitsContent>) {
  const items = content.items || []

  const handleChange = <K extends keyof BenefitsContent>(
    key: K,
    value: BenefitsContent[K]
  ) => {
    onChange({ ...content, [key]: value })
  }

  const handleItemChange = (
    index: number,
    key: keyof BenefitItem,
    value: string | string[]
  ) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [key]: value }
    handleChange('items', newItems)
  }

  const handleAddItem = () => {
    const newItems = [
      ...items,
      { title: '', description: '', points: [] } as BenefitItem,
    ]
    handleChange('items', newItems)
  }

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    handleChange('items', newItems)
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>タイトル</Label>
        <Input
          value={content.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="セクションタイトル"
        />
      </div>
      <div className="space-y-2">
        <Label>サブタイトル</Label>
        <Input
          value={content.subtitle || ''}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          placeholder="補足説明"
        />
      </div>
      <div className="space-y-2">
        <Label>バリアント</Label>
        <Select
          value={(content as unknown as Record<string, unknown>).variant as string || 'alternating'}
          onValueChange={(value) => {
            const updated = { ...content } as unknown as Record<string, unknown>
            updated.variant = value
            onChange(updated as unknown as BenefitsContent)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {benefitsVariants.map((variant) => (
              <SelectItem key={variant.value} value={variant.value}>
                {variant.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>メリットアイテム</Label>
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">メリット {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500"
                onClick={() => handleRemoveItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={item.title || ''}
              onChange={(e) => handleItemChange(index, 'title', e.target.value)}
              placeholder="タイトル"
            />
            <Textarea
              value={item.description || ''}
              onChange={(e) =>
                handleItemChange(index, 'description', e.target.value)
              }
              placeholder="説明文"
              className="min-h-[60px]"
            />
            <Input
              value={item.image || ''}
              onChange={(e) => handleItemChange(index, 'image', e.target.value)}
              placeholder="画像URL（省略可）"
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
        >
          <Plus className="mr-2 h-4 w-4" />
          メリットを追加
        </Button>
      </div>
    </div>
  )
}
