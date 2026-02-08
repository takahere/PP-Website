'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface RedirectData {
  from_path: string
  to_path: string
  is_permanent: boolean
}

export async function createRedirect(
  data: RedirectData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // パスの正規化（先頭にスラッシュを追加）
    const fromPath = data.from_path.startsWith('/')
      ? data.from_path
      : `/${data.from_path}`
    const toPath = data.to_path.startsWith('/')
      ? data.to_path
      : `/${data.to_path}`

    const { error } = await supabase.from('redirects').insert({
      from_path: fromPath,
      to_path: toPath,
      is_permanent: data.is_permanent,
    })

    if (error) {
      console.error('Error creating redirect:', error)
      if (error.code === '23505') {
        return { success: false, error: 'このパスのリダイレクトは既に存在します' }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/redirects')
    return { success: true }
  } catch (err) {
    console.error('Error in createRedirect:', err)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

export async function deleteRedirect(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('redirects').delete().eq('id', id)

    if (error) {
      console.error('Error deleting redirect:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/redirects')
    return { success: true }
  } catch (err) {
    console.error('Error in deleteRedirect:', err)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}


















