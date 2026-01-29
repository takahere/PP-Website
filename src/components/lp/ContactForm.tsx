'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
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

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
}

export interface ContactFormProps {
  title?: string
  description?: string
  fields: FormField[]
  submit_text?: string
  success_message?: string
  action_url?: string
}

export function ContactForm({
  title,
  description,
  fields,
  submit_text = '送信する',
  success_message = 'お問い合わせを受け付けました。担当者より折り返しご連絡いたします。',
  action_url,
}: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (action_url) {
        await fetch(action_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }
      // シミュレーション
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsSubmitted(true)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (isSubmitted) {
    return (
      <section className="bg-white py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Send className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              送信完了
            </h3>
            <p className="mt-4 text-gray-600">{success_message}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white py-20" id="contact-form">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        {(title || description) && (
          <div className="mb-10 text-center">
            {title && (
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-4 text-lg text-gray-600">{description}</p>
            )}
          </div>
        )}

        {/* フォーム */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-gray-50 p-8"
        >
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </Label>

              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="min-h-[120px] bg-white"
                />
              ) : field.type === 'select' && field.options ? (
                <Select
                  value={formData[field.name] || ''}
                  onValueChange={(value) => handleChange(field.name, value)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={field.placeholder || '選択してください'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="bg-white"
                />
              )}
            </div>
          ))}

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full bg-[var(--pp-coral)] hover:bg-[var(--pp-coral-hover)] text-white py-6 text-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                {submit_text}
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  )
}














