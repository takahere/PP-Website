'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface PostData {
  id?: string
  slug: string
  title: string
  content_html: string
  thumbnail?: string | null
  seo_description?: string | null
  og_description?: string | null
  is_published?: boolean
  type?: string
}

export async function updatePost(
  data: PostData
): Promise<{ success: boolean; error?: string }> {
  try {
    // 認証確認
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: '認証が必要です' }
    }

    // 管理操作なのでadminClientを使用
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('posts')
      .update({
        title: data.title,
        content_html: data.content_html,
        thumbnail: data.thumbnail,
        seo_description: data.seo_description,
        og_description: data.og_description,
        is_published: data.is_published,
      })
      .eq('slug', data.slug)

    if (error) {
      console.error('Error updating post:', error)
      return { success: false, error: error.message }
    }

    // キャッシュを再検証
    revalidatePath('/admin/posts')
    revalidatePath(`/admin/posts/${data.slug}/edit`)
    revalidatePath(`/news/${data.slug}`)
    revalidatePath(`/seminar/${data.slug}`)

    return { success: true }
  } catch (err) {
    console.error('Error in updatePost:', err)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

export async function deletePost(
  slug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 認証確認
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: '認証が必要です' }
    }

    // 管理操作なのでadminClientを使用
    const adminClient = createAdminClient()

    const { error } = await adminClient.from('posts').delete().eq('slug', slug)

    if (error) {
      console.error('Error deleting post:', error)
      return { success: false, error: error.message }
    }

    // キャッシュを再検証
    revalidatePath('/admin/posts')

    return { success: true }
  } catch (err) {
    console.error('Error in deletePost:', err)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}


