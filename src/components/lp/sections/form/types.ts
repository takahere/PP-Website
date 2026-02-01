/**
 * フォームフィールド型
 */
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
}

/**
 * フォームセクションのコンテンツ型
 */
export interface FormContent {
  title: string
  description: string
  fields: FormField[]
  submit_text: string
  success_message?: string
  action_url?: string
}
