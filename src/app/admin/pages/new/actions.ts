'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

interface CreatePageInput {
  title: string
  slug: string
  type: string
}

interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

// ページを作成
export async function createPage(input: CreatePageInput): Promise<ActionResult> {
  const supabase = await createClient()

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: '認証が必要です' }
  }

  // Admin client for write operations (bypasses RLS)
  const adminClient = createAdminClient()

  // スラッグの重複チェック
  const { data: existing } = await adminClient
    .from('pages')
    .select('id')
    .eq('slug', input.slug)
    .single()

  if (existing) {
    return { success: false, error: 'このスラッグは既に使用されています' }
  }

  // ページを作成（sectionsは空で開始）
  const { data, error } = await adminClient
    .from('pages')
    .insert({
      title: input.title,
      slug: input.slug,
      type: input.type,
      content_html: '',
      sections: null, // 編集画面でセクションモードに切り替えると作成される
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating page:', error)
    return { success: false, error: 'ページの作成に失敗しました' }
  }

  revalidatePath('/admin/pages')
  return { success: true, id: data.id }
}
