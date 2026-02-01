'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// シートデータの型定義
export interface SheetRow {
  [key: string]: string | number | null
}

export interface SheetChart {
  type: 'line' | 'bar' | 'pie' | 'area'
  dataKeys: string[]
  xAxisKey: string
  title?: string
}

export interface SheetData {
  columns: string[]
  rows: SheetRow[]
  chart: SheetChart | null
}

export interface AnalysisSheet {
  id: string
  title: string
  description: string | null
  data: SheetData
  created_at: string
  updated_at: string
}

interface ActionResult {
  success: boolean
  error?: string
  data?: AnalysisSheet
}

// Admin クライアントを取得
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createAdminClient(supabaseUrl, serviceRoleKey)
}

// 新規シート作成
export async function createSheet(title: string, description?: string): Promise<ActionResult> {
  try {
    const adminClient = getAdminClient()

    const initialData: SheetData = {
      columns: ['A', 'B', 'C', 'D', 'E'],
      rows: [],
      chart: null,
    }

    const { data, error } = await adminClient
      .from('analysis_sheets')
      .insert({
        title,
        description: description || null,
        data: initialData,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sheet:', error)
      return { success: false, error: `シートの作成に失敗しました: ${error.message}` }
    }

    revalidatePath('/admin/data-analysis')
    return { success: true, data: data as AnalysisSheet }
  } catch (error) {
    console.error('Error creating sheet:', error)
    return { success: false, error: '予期せぬエラーが発生しました' }
  }
}

// シート一覧取得
export async function getSheets(): Promise<AnalysisSheet[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('analysis_sheets')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching sheets:', error)
    return []
  }

  return (data || []) as AnalysisSheet[]
}

// シート単体取得
export async function getSheet(id: string): Promise<AnalysisSheet | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('analysis_sheets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching sheet:', error)
    return null
  }

  return data as AnalysisSheet
}

// シート更新
export async function updateSheet(
  id: string,
  updates: {
    title?: string
    description?: string
    data?: SheetData
  }
): Promise<ActionResult> {
  try {
    const adminClient = getAdminClient()

    const { data, error } = await adminClient
      .from('analysis_sheets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating sheet:', error)
      return { success: false, error: `シートの更新に失敗しました: ${error.message}` }
    }

    revalidatePath('/admin/data-analysis')
    revalidatePath(`/admin/data-analysis/${id}`)
    return { success: true, data: data as AnalysisSheet }
  } catch (error) {
    console.error('Error updating sheet:', error)
    return { success: false, error: '予期せぬエラーが発生しました' }
  }
}

// シート削除
export async function deleteSheet(id: string): Promise<ActionResult> {
  try {
    const adminClient = getAdminClient()

    const { error } = await adminClient
      .from('analysis_sheets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting sheet:', error)
      return { success: false, error: `シートの削除に失敗しました: ${error.message}` }
    }

    revalidatePath('/admin/data-analysis')
    return { success: true }
  } catch (error) {
    console.error('Error deleting sheet:', error)
    return { success: false, error: '予期せぬエラーが発生しました' }
  }
}

// シートデータを更新（AIからの更新用）
export async function updateSheetData(
  id: string,
  sheetData: SheetData
): Promise<ActionResult> {
  return updateSheet(id, { data: sheetData })
}















