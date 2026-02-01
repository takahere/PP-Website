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
import type { HeroContent } from './types'
import { heroVariants } from './config'

/**
 * ヒーローセクションエディタ
 */
export function HeroEditor({ content, onChange }: SectionEditorProps<HeroContent>) {
  const handleChange = (key: keyof HeroContent, value: string) => {
    onChange({ ...content, [key]: value })
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>見出し</Label>
        <Input
          value={content.headline || ''}
          onChange={(e) => handleChange('headline', e.target.value)}
          placeholder="メインの見出しテキスト"
        />
      </div>
      <div className="space-y-2">
        <Label>サブ見出し</Label>
        <Textarea
          value={content.subheadline || ''}
          onChange={(e) => handleChange('subheadline', e.target.value)}
          placeholder="補足説明テキスト"
        />
      </div>
      <div className="space-y-2">
        <Label>CTAボタンテキスト</Label>
        <Input
          value={content.cta_text || ''}
          onChange={(e) => handleChange('cta_text', e.target.value)}
          placeholder="今すぐ始める"
        />
      </div>
      <div className="space-y-2">
        <Label>CTAリンク先</Label>
        <Input
          value={content.cta_link || ''}
          onChange={(e) => handleChange('cta_link', e.target.value)}
          placeholder="#contact-form"
        />
      </div>
      <div className="space-y-2">
        <Label>背景画像URL</Label>
        <Input
          value={content.background_image || ''}
          onChange={(e) => handleChange('background_image', e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label>バリアント</Label>
        <Select
          value={(content as unknown as Record<string, unknown>).variant as string || 'simple'}
          onValueChange={(value) => {
            const updated = { ...content } as unknown as Record<string, unknown>
            updated.variant = value
            onChange(updated as unknown as HeroContent)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {heroVariants.map((variant) => (
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
