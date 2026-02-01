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
import type { FormContent, FormField } from './types'

/**
 * フォームセクションエディタ
 */
export function FormEditor({
  content,
  onChange,
}: SectionEditorProps<FormContent>) {
  const fields = content.fields || []

  const handleChange = <K extends keyof FormContent>(
    key: K,
    value: FormContent[K]
  ) => {
    onChange({ ...content, [key]: value })
  }

  const handleFieldChange = (
    index: number,
    key: keyof FormField,
    value: string | boolean
  ) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], [key]: value }
    handleChange('fields', newFields)
  }

  const handleAddField = () => {
    const newFields = [
      ...fields,
      { name: '', label: '', type: 'text', required: false } as FormField,
    ]
    handleChange('fields', newFields)
  }

  const handleRemoveField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index)
    handleChange('fields', newFields)
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>タイトル</Label>
        <Input
          value={content.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="お問い合わせ"
        />
      </div>
      <div className="space-y-2">
        <Label>説明文</Label>
        <Textarea
          value={content.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="フォームの説明"
        />
      </div>
      <div className="space-y-2">
        <Label>送信ボタンテキスト</Label>
        <Input
          value={content.submit_text || ''}
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
                onClick={() => handleRemoveField(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={field.name || ''}
                onChange={(e) =>
                  handleFieldChange(index, 'name', e.target.value)
                }
                placeholder="フィールド名（英字）"
              />
              <Input
                value={field.label || ''}
                onChange={(e) =>
                  handleFieldChange(index, 'label', e.target.value)
                }
                placeholder="ラベル"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={field.type || 'text'}
                onValueChange={(value) =>
                  handleFieldChange(index, 'type', value)
                }
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
                onValueChange={(value) =>
                  handleFieldChange(index, 'required', value === 'true')
                }
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
          onClick={handleAddField}
        >
          <Plus className="mr-2 h-4 w-4" />
          フィールドを追加
        </Button>
      </div>
    </div>
  )
}
