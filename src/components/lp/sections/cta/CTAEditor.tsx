'use client'

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
import type { CTAContent } from './types'
import { ctaVariants } from './config'

/**
 * CTAセクションエディタ
 */
export function CTAEditor({ content, onChange }: SectionEditorProps<CTAContent>) {
  const handleChange = (key: keyof CTAContent, value: string) => {
    onChange({ ...content, [key]: value })
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>見出し</Label>
        <Input
          value={content.headline || ''}
          onChange={(e) => handleChange('headline', e.target.value)}
          placeholder="行動を促す見出し"
        />
      </div>
      <div className="space-y-2">
        <Label>説明文</Label>
        <Textarea
          value={content.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="補足説明"
        />
      </div>
      <div className="space-y-2">
        <Label>ボタンテキスト</Label>
        <Input
          value={content.button_text || ''}
          onChange={(e) => handleChange('button_text', e.target.value)}
          placeholder="お問い合わせ"
        />
      </div>
      <div className="space-y-2">
        <Label>ボタンリンク先</Label>
        <Input
          value={content.button_link || ''}
          onChange={(e) => handleChange('button_link', e.target.value)}
          placeholder="#contact-form"
        />
      </div>
      <div className="space-y-2">
        <Label>バリアント</Label>
        <Select
          value={(content as unknown as Record<string, unknown>).variant as string || 'gradient'}
          onValueChange={(value) => {
            const updated = { ...content } as unknown as Record<string, unknown>
            updated.variant = value
            onChange(updated as unknown as CTAContent)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ctaVariants.map((variant) => (
              <SelectItem key={variant.value} value={variant.value}>
                {variant.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
