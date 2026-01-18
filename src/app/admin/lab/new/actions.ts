'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

type ContentType = 'research' | 'interview' | 'knowledge' | null

interface CreateLabArticleInput {
  title: string
  slug: string
  categories?: string[]
  tags?: string[]
  content_type?: ContentType
}

interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

// Lab記事を作成
export async function createLabArticle(input: CreateLabArticleInput): Promise<ActionResult> {
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
    .from('lab_articles')
    .select('id')
    .eq('slug', input.slug)
    .single()

  if (existing) {
    return { success: false, error: 'このスラッグは既に使用されています' }
  }

  // Lab記事を作成
  const { data, error } = await adminClient
    .from('lab_articles')
    .insert({
      title: input.title,
      slug: input.slug,
      content_html: '',
      is_published: false,
      categories: input.categories || [],
      tags: input.tags || [],
      content_type: input.content_type || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating lab article:', error)
    return { success: false, error: `Lab記事の作成に失敗しました: ${error.message}` }
  }

  revalidatePath('/admin/lab')
  revalidatePath('/lab')
  return { success: true, id: data.id }
}

