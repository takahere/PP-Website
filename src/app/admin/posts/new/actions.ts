'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

interface CreatePostInput {
  title: string
  slug: string
  type: 'news' | 'seminar'
}

interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

// 記事を作成
export async function createPost(input: CreatePostInput): Promise<ActionResult> {
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
    .from('posts')
    .select('id')
    .eq('slug', input.slug)
    .single()

  if (existing) {
    return { success: false, error: 'このスラッグは既に使用されています' }
  }

  // 記事を作成
  const { data, error } = await adminClient
    .from('posts')
    .insert({
      title: input.title,
      slug: input.slug,
      type: input.type,
      content_html: '',
      is_published: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating post:', error)
    return { success: false, error: `記事の作成に失敗しました: ${error.message}` }
  }

  revalidatePath('/admin/posts')
  return { success: true, id: data.id }
}

