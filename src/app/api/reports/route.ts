import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReportTemplateInput, DEFAULT_TEMPLATES } from '@/lib/reports'

/**
 * GET /api/reports
 * レポートテンプレート一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // データベースからテンプレートを取得
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .or(`created_by.eq.${user.id},is_public.eq.true`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch templates:', error)
      // エラー時はデフォルトテンプレートを返す
      return NextResponse.json({
        data: DEFAULT_TEMPLATES.map((t, i) => ({
          ...t,
          id: `default-${i}`,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        source: 'default',
      })
    }

    // データベースにテンプレートがない場合はデフォルトを追加
    if (!data || data.length === 0) {
      return NextResponse.json({
        data: DEFAULT_TEMPLATES.map((t, i) => ({
          ...t,
          id: `default-${i}`,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        source: 'default',
      })
    }

    // データベースの形式からアプリの形式に変換
    const templates = data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      config: row.config,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isPublic: row.is_public,
    }))

    return NextResponse.json({ data: templates })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reports
 * 新しいレポートテンプレートを作成
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ReportTemplateInput = await request.json()

    // バリデーション
    if (!body.name || !body.config) {
      return NextResponse.json(
        { error: 'name and config are required' },
        { status: 400 }
      )
    }

    if (!body.config.metrics || body.config.metrics.length === 0) {
      return NextResponse.json(
        { error: 'At least one metric is required' },
        { status: 400 }
      )
    }

    // データベースに保存
    const { data, error } = await supabase
      .from('report_templates')
      .insert({
        name: body.name,
        description: body.description || null,
        config: body.config,
        created_by: user.id,
        is_public: body.isPublic || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create template:', error)
      return NextResponse.json(
        { error: 'Failed to create template', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        config: data.config,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isPublic: data.is_public,
      },
    })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
