'use client'

import { useState, useEffect } from 'react'
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
import type { LPSection, LPSectionType } from '@/components/lp'

interface SectionEditorProps {
  section: LPSection
  onUpdate: (content: Record<string, unknown>) => void
}

export function SectionEditor({ section, onUpdate }: SectionEditorProps) {
  const [content, setContent] = useState(section.content)

  // セクションが変更されたときにローカル状態を同期
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(section.content)
  }, [section.id, section.content])

  const handleChange = (key: string, value: unknown) => {
    const newContent = { ...content, [key]: value }
    setContent(newContent)
    onUpdate(newContent)
  }

  const handleArrayItemChange = (
    arrayKey: string,
    index: number,
    itemKey: string,
    value: unknown
  ) => {
    const array = [...((content[arrayKey] as unknown[]) || [])]
    array[index] = { ...(array[index] as Record<string, unknown>), [itemKey]: value }
    handleChange(arrayKey, array)
  }

  const handleAddArrayItem = (arrayKey: string, defaultItem: Record<string, unknown>) => {
    const array = [...((content[arrayKey] as unknown[]) || []), defaultItem]
    handleChange(arrayKey, array)
  }

  const handleRemoveArrayItem = (arrayKey: string, index: number) => {
    const array = [...((content[arrayKey] as unknown[]) || [])]
    array.splice(index, 1)
    handleChange(arrayKey, array)
  }

  // Hero Section Editor
  if (section.type === 'hero') {
    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>見出し</Label>
          <Input
            value={(content.headline as string) || ''}
            onChange={(e) => handleChange('headline', e.target.value)}
            placeholder="メインの見出しテキスト"
          />
        </div>
        <div className="space-y-2">
          <Label>サブ見出し</Label>
          <Textarea
            value={(content.subheadline as string) || ''}
            onChange={(e) => handleChange('subheadline', e.target.value)}
            placeholder="補足説明テキスト"
          />
        </div>
        <div className="space-y-2">
          <Label>CTAボタンテキスト</Label>
          <Input
            value={(content.cta_text as string) || ''}
            onChange={(e) => handleChange('cta_text', e.target.value)}
            placeholder="今すぐ始める"
          />
        </div>
        <div className="space-y-2">
          <Label>CTAリンク先</Label>
          <Input
            value={(content.cta_link as string) || ''}
            onChange={(e) => handleChange('cta_link', e.target.value)}
            placeholder="#contact-form"
          />
        </div>
        <div className="space-y-2">
          <Label>背景画像URL</Label>
          <Input
            value={(content.background_image as string) || ''}
            onChange={(e) => handleChange('background_image', e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>バリアント</Label>
          <Select
            value={(content.variant as string) || 'simple'}
            onValueChange={(value) => handleChange('variant', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">シンプル</SelectItem>
              <SelectItem value="with-image">画像付き</SelectItem>
              <SelectItem value="centered">中央寄せ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  // Features Section Editor
  if (section.type === 'features') {
    const items = (content.items as Array<{ icon?: string; title: string; description: string }>) || []
    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>タイトル</Label>
          <Input
            value={(content.title as string) || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="セクションタイトル"
          />
        </div>
        <div className="space-y-2">
          <Label>サブタイトル</Label>
          <Input
            value={(content.subtitle as string) || ''}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder="補足説明"
          />
        </div>
        <div className="space-y-2">
          <Label>カラム数</Label>
          <Select
            value={String(content.columns || 3)}
            onValueChange={(value) => handleChange('columns', parseInt(value))}
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
                  onClick={() => handleRemoveArrayItem('items', index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={item.icon || ''}
                onChange={(e) => handleArrayItemChange('items', index, 'icon', e.target.value)}
                placeholder="アイコン名（zap, shield, trending, users, settings, chart）"
              />
              <Input
                value={item.title || ''}
                onChange={(e) => handleArrayItemChange('items', index, 'title', e.target.value)}
                placeholder="タイトル"
              />
              <Textarea
                value={item.description || ''}
                onChange={(e) => handleArrayItemChange('items', index, 'description', e.target.value)}
                placeholder="説明文"
                className="min-h-[60px]"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              handleAddArrayItem('items', { icon: 'sparkles', title: '', description: '' })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            アイテムを追加
          </Button>
        </div>
      </div>
    )
  }

  // Benefits Section Editor
  if (section.type === 'benefits') {
    const items = (content.items as Array<{ title: string; description: string; image?: string; points?: string[] }>) || []
    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>タイトル</Label>
          <Input
            value={(content.title as string) || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="セクションタイトル"
          />
        </div>
        <div className="space-y-2">
          <Label>サブタイトル</Label>
          <Input
            value={(content.subtitle as string) || ''}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder="補足説明"
          />
        </div>
        <div className="space-y-2">
          <Label>バリアント</Label>
          <Select
            value={(content.variant as string) || 'alternating'}
            onValueChange={(value) => handleChange('variant', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alternating">左右交互</SelectItem>
              <SelectItem value="list">リスト形式</SelectItem>
              <SelectItem value="cards">カード形式</SelectItem>
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
                  onClick={() => handleRemoveArrayItem('items', index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={item.title || ''}
                onChange={(e) => handleArrayItemChange('items', index, 'title', e.target.value)}
                placeholder="タイトル"
              />
              <Textarea
                value={item.description || ''}
                onChange={(e) => handleArrayItemChange('items', index, 'description', e.target.value)}
                placeholder="説明文"
                className="min-h-[60px]"
              />
              <Input
                value={item.image || ''}
                onChange={(e) => handleArrayItemChange('items', index, 'image', e.target.value)}
                placeholder="画像URL（省略可）"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              handleAddArrayItem('items', { title: '', description: '', points: [] })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            メリットを追加
          </Button>
        </div>
      </div>
    )
  }

  // CTA Section Editor
  if (section.type === 'cta') {
    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>見出し</Label>
          <Input
            value={(content.headline as string) || ''}
            onChange={(e) => handleChange('headline', e.target.value)}
            placeholder="行動を促す見出し"
          />
        </div>
        <div className="space-y-2">
          <Label>説明文</Label>
          <Textarea
            value={(content.description as string) || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="補足説明"
          />
        </div>
        <div className="space-y-2">
          <Label>ボタンテキスト</Label>
          <Input
            value={(content.button_text as string) || ''}
            onChange={(e) => handleChange('button_text', e.target.value)}
            placeholder="お問い合わせ"
          />
        </div>
        <div className="space-y-2">
          <Label>ボタンリンク先</Label>
          <Input
            value={(content.button_link as string) || ''}
            onChange={(e) => handleChange('button_link', e.target.value)}
            placeholder="#contact-form"
          />
        </div>
        <div className="space-y-2">
          <Label>バリアント</Label>
          <Select
            value={(content.variant as string) || 'gradient'}
            onValueChange={(value) => handleChange('variant', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">シンプル</SelectItem>
              <SelectItem value="gradient">グラデーション</SelectItem>
              <SelectItem value="dark">ダーク</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  // Contact Form Section Editor
  if (section.type === 'form') {
    const fields = (content.fields as Array<{ name: string; label: string; type: string; required?: boolean; placeholder?: string }>) || []
    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>タイトル</Label>
          <Input
            value={(content.title as string) || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="お問い合わせ"
          />
        </div>
        <div className="space-y-2">
          <Label>説明文</Label>
          <Textarea
            value={(content.description as string) || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="フォームの説明"
          />
        </div>
        <div className="space-y-2">
          <Label>送信ボタンテキスト</Label>
          <Input
            value={(content.submit_text as string) || ''}
            onChange={(e) => handleChange('submit_text', e.target.value)}
            placeholder="送信する"
          />
        </div>
        <div className="space-y-2">
          <Label>フォームフィールド</Label>
          {fields.map((field, index) => (
            <div key={index} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">フィールド {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500"
                  onClick={() => handleRemoveArrayItem('fields', index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={field.name || ''}
                  onChange={(e) => handleArrayItemChange('fields', index, 'name', e.target.value)}
                  placeholder="フィールド名（英字）"
                />
                <Input
                  value={field.label || ''}
                  onChange={(e) => handleArrayItemChange('fields', index, 'label', e.target.value)}
                  placeholder="ラベル"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={field.type || 'text'}
                  onValueChange={(value) => handleArrayItemChange('fields', index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">テキスト</SelectItem>
                    <SelectItem value="email">メール</SelectItem>
                    <SelectItem value="tel">電話番号</SelectItem>
                    <SelectItem value="textarea">テキストエリア</SelectItem>
                    <SelectItem value="select">セレクト</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={field.required ? 'true' : 'false'}
                  onValueChange={(value) => handleArrayItemChange('fields', index, 'required', value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">必須</SelectItem>
                    <SelectItem value="false">任意</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              handleAddArrayItem('fields', { name: '', label: '', type: 'text', required: false })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            フィールドを追加
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 text-muted-foreground">
      このセクションタイプのエディタは準備中です
    </div>
  )
}

// エクスポート用の型
export type { LPSection, LPSectionType }

