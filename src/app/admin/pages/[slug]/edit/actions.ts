'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LPSection } from '@/components/lp'

interface PageData {
  id?: string
  slug: string
  title: string
  content_html: string
  sections?: LPSection[] | null
  thumbnail?: string | null
  seo_description?: string | null
  og_description?: string | null
  type?: string
  is_published?: boolean
}

export async function updatePage(
  data: PageData
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

    const updateData: Record<string, unknown> = {
      title: data.title,
      content_html: data.content_html,
      sections: data.sections,
      thumbnail: data.thumbnail,
      seo_description: data.seo_description,
      og_description: data.og_description,
    }

    // is_published が明示的に指定されている場合のみ更新
    if (data.is_published !== undefined) {
      updateData.is_published = data.is_published
    }

    const { error } = await adminClient
      .from('pages')
      .update(updateData)
      .eq('slug', data.slug)

    if (error) {
      console.error('Error updating page:', error)
      return { success: false, error: error.message }
    }

    // キャッシュを再検証
    revalidatePath('/admin/pages')
    revalidatePath(`/admin/pages/${data.slug}/edit`)
    
    // ページタイプに応じてパスを再検証
    if (data.type === 'casestudy') {
      revalidatePath(`/casestudy/${data.slug}`)
    } else if (data.type === 'knowledge') {
      revalidatePath(`/knowledge/${data.slug}`)
    } else {
      revalidatePath(`/${data.slug}`)
    }

    return { success: true }
  } catch (err) {
    console.error('Error in updatePage:', err)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

export async function deletePage(
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

    const { error } = await adminClient.from('pages').delete().eq('slug', slug)

    if (error) {
      console.error('Error deleting page:', error)
      return { success: false, error: error.message }
    }

    // キャッシュを再検証
    revalidatePath('/admin/pages')

    return { success: true }
  } catch (err) {
    console.error('Error in deletePage:', err)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}
