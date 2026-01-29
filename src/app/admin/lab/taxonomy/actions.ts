'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

// ============================================================
// カテゴリー操作
// ============================================================

export async function createCategory(
  name: string,
  slug: string
): Promise<ActionResult> {
  const supabase = await createClient()

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: '認証が必要です' }
  }

  const adminClient = createAdminClient()

  // スラッグの重複チェック
  const { data: existing } = await adminClient
    .from('lab_categories')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return { success: false, error: 'このスラッグは既に使用されています' }
  }

  // カテゴリーを作成
  const { data, error } = await adminClient
    .from('lab_categories')
    .insert({
      name,
      slug,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating category:', error)
    return { success: false, error: `カテゴリーの作成に失敗しました: ${error.message}` }
  }

  revalidatePath('/admin/lab/taxonomy')
  revalidatePath('/admin/lab')
  revalidatePath('/lab')
  return { success: true, id: data.id }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: '認証が必要です' }
  }

  const adminClient = createAdminClient()

  // カテゴリーを削除
  const { error } = await adminClient
    .from('lab_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    return { success: false, error: `カテゴリーの削除に失敗しました: ${error.message}` }
  }

  revalidatePath('/admin/lab/taxonomy')
  revalidatePath('/admin/lab')
  revalidatePath('/lab')
  return { success: true }
}

// ============================================================
// タグ操作
// ============================================================

export async function createTag(
  name: string,
  slug: string
): Promise<ActionResult> {
  const supabase = await createClient()

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: '認証が必要です' }
  }

  const adminClient = createAdminClient()

  // スラッグの重複チェック
  const { data: existing } = await adminClient
    .from('lab_tags')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return { success: false, error: 'このスラッグは既に使用されています' }
  }

  // タグを作成
  const { data, error } = await adminClient
    .from('lab_tags')
    .insert({
      name,
      slug,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating tag:', error)
    return { success: false, error: `タグの作成に失敗しました: ${error.message}` }
  }

  revalidatePath('/admin/lab/taxonomy')
  revalidatePath('/admin/lab')
  revalidatePath('/lab')
  return { success: true, id: data.id }
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: '認証が必要です' }
  }

  const adminClient = createAdminClient()

  // タグを削除
  const { error } = await adminClient
    .from('lab_tags')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting tag:', error)
    return { success: false, error: `タグの削除に失敗しました: ${error.message}` }
  }

  revalidatePath('/admin/lab/taxonomy')
  revalidatePath('/admin/lab')
  revalidatePath('/lab')
  return { success: true }
}














