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
import type { FeaturesContent, FeatureItem } from './types'

/**
 * 機能紹介セクションエディタ
 */
export function FeaturesEditor({
  content,
  onChange,
}: SectionEditorProps<FeaturesContent>) {
  const items = content.items || []

  const handleChange = <K extends keyof FeaturesContent>(
    key: K,
    value: FeaturesContent[K]
  ) => {
    onChange({ ...content, [key]: value })
  }

  const handleItemChange = (
    index: number,
    key: keyof FeatureItem,
    value: string
  ) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [key]: value }
    handleChange('items', newItems)
  }

  const handleAddItem = () => {
    const newItems = [...items, { icon: 'sparkles', title: '', description: '' }]
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
        <Label>カラム数</Label>
        <Select
          value={String(content.columns || 3)}
          onValueChange={(value) =>
            handleChange('columns', parseInt(value) as 2 | 3 | 4)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2カラム</SelectItem>
            <SelectItem value="3">3カラム</SelectItem>
            <SelectItem value="4">4カラム</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>特徴アイテム</Label>
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">アイテム {index + 1}</span>
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
              value={item.icon || ''}
              onChange={(e) => handleItemChange(index, 'icon', e.target.value)}
              placeholder="アイコン名（zap, shield, trending, users, settings, chart）"
            />
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
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
        >
          <Plus className="mr-2 h-4 w-4" />
          アイテムを追加
        </Button>
      </div>
    </div>
  )
}
