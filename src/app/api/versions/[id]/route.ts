'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 特定のバージョンを取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params

    const adminClient = createAdminClient()

    const { data: version, error } = await adminClient
      .from('content_versions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'バージョン履歴テーブルが存在しません' },
          { status: 404 }
        )
      }
      console.error('Error fetching version:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!version) {
      return NextResponse.json(
        { error: 'バージョンが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ version })
  } catch (err) {
    console.error('Error in GET version:', err)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
