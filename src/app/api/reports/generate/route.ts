import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ReportConfig,
  generateDemoReportData,
  generateCSV,
  createCSVBlob,
  generateFileName,
  DEFAULT_TEMPLATES,
} from '@/lib/reports'

/**
 * POST /api/reports/generate
 * レポートを生成
 *
 * Body:
 * - templateId?: string - テンプレートIDから生成
 * - config?: ReportConfig - 直接設定から生成
 * - format?: 'json' | 'csv' - 出力形式
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

    const body = await request.json()
    const { templateId, config: directConfig, format = 'json' } = body

    let reportConfig: ReportConfig
    let templateName = 'カスタムレポート'

    // テンプレートIDが指定された場合はDBから取得
    if (templateId) {
      // デフォルトテンプレートのチェック
      if (templateId.startsWith('default-')) {
        const index = parseInt(templateId.replace('default-', ''))
        const defaultTemplate = DEFAULT_TEMPLATES[index]
        if (!defaultTemplate) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }
        reportConfig = defaultTemplate.config
        templateName = defaultTemplate.name
      } else {
        // データベースから取得
        const { data: template, error } = await supabase
          .from('report_templates')
          .select('*')
          .eq('id', templateId)
          .single()

        if (error || !template) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        // アクセス権チェック
        if (!template.is_public && template.created_by !== user.id) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        reportConfig = template.config as ReportConfig
        templateName = template.name
      }
    } else if (directConfig) {
      // 直接設定が指定された場合
      reportConfig = directConfig as ReportConfig
    } else {
      return NextResponse.json(
        { error: 'templateId or config is required' },
        { status: 400 }
      )
    }

    // バリデーション
    if (!reportConfig.metrics || reportConfig.metrics.length === 0) {
      return NextResponse.json(
        { error: 'At least one metric is required' },
        { status: 400 }
      )
    }

    // レポートデータを生成（現在はデモデータ）
    // TODO: 実際のGA4/GSC APIからデータを取得
    const report = generateDemoReportData(reportConfig)
    report.templateName = templateName
    report.templateId = templateId || 'custom'

    // 形式に応じてレスポンスを返す
    if (format === 'csv') {
      const csvContent = generateCSV(report, reportConfig.metrics)
      const fileName = generateFileName(templateName, 'csv')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      })
    }

    // JSONレスポンス
    return NextResponse.json({
      data: report,
      format: 'json',
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report', message: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reports/generate?templateId=xxx&format=csv
 * GETでもレポート生成可能（リンク共有用）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const format = searchParams.get('format') || 'json'

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let reportConfig: ReportConfig
    let templateName = 'カスタムレポート'

    // デフォルトテンプレートのチェック
    if (templateId.startsWith('default-')) {
      const index = parseInt(templateId.replace('default-', ''))
      const defaultTemplate = DEFAULT_TEMPLATES[index]
      if (!defaultTemplate) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      reportConfig = defaultTemplate.config
      templateName = defaultTemplate.name
    } else {
      // データベースから取得
      const { data: template, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error || !template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      if (!template.is_public && template.created_by !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      reportConfig = template.config as ReportConfig
      templateName = template.name
    }

    // レポート生成
    const report = generateDemoReportData(reportConfig)
    report.templateName = templateName
    report.templateId = templateId

    if (format === 'csv') {
      const csvContent = generateCSV(report, reportConfig.metrics)
      const fileName = generateFileName(templateName, 'csv')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      })
    }

    return NextResponse.json({ data: report })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
