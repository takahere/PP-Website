'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ContentType = 'research' | 'interview' | 'knowledge' | null

interface LabArticleData {
  id?: string
  slug: string
  title: string
  content_html: string
  thumbnail?: string | null
  seo_description?: string | null
  og_description?: string | null
  is_published?: boolean
  categories?: string[]
  tags?: string[]
  content_type?: ContentType
}

export async function updateLabArticle(
  data: LabArticleData
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
      .from('lab_articles')
      .update({
        title: data.title,
        content_html: data.content_html,
        thumbnail: data.thumbnail,
        seo_description: data.seo_description,
        og_description: data.og_description,
        is_published: data.is_published,
        categories: data.categories || [],
        tags: data.tags || [],
        content_type: data.content_type || null,
      })
      .eq('slug', data.slug)

    if (error) {
      console.error('Error updating lab article:', error)
      return { success: false, error: error.message }
    }

    // キャッシュを再検証
    revalidatePath('/admin/lab')
    revalidatePath(`/admin/lab/${data.slug}/edit`)
    revalidatePath(`/lab/${data.slug}`)
    revalidatePath('/lab')

    return { success: true }
  } catch (err) {
    console.error('Error in updateLabArticle:', err)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

export async function deleteLabArticle(
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

    const { error } = await adminClient
      .from('lab_articles')
      .delete()
      .eq('slug', slug)

    if (error) {
      console.error('Error deleting lab article:', error)
      return { success: false, error: error.message }
    }

    // キャッシュを再検証
    revalidatePath('/admin/lab')
    revalidatePath('/lab')

    return { success: true }
  } catch (err) {
    console.error('Error in deleteLabArticle:', err)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

