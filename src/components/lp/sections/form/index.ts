import type { SectionDefinition } from '../../core/types'
import type { FormContent } from './types'
import { formLabel, formDescription, formDefaultContent } from './config'
import { FormSection } from './FormSection'
import { FormEditor } from './FormEditor'

export type { FormContent, FormField } from './types'

export { FormSection } from './FormSection'
export { FormEditor } from './FormEditor'

/**
 * フォームセクション定義
 */
export const formDefinition: SectionDefinition<FormContent> = {
  type: 'form',
  label: formLabel,
  description: formDescription,
  defaultContent: formDefaultContent,
  Component: FormSection,
  Editor: FormEditor,
}
