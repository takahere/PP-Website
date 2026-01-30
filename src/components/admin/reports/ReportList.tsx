'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  Download,
  RefreshCw,
  Loader2,
  Calendar,
  BarChart3,
  Globe,
  Lock,
} from 'lucide-react'
import { ReportTemplate } from '@/lib/reports'

export function ReportList() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/reports')
      if (!response.ok) throw new Error('Failed to fetch templates')

      const { data } = await response.json()
      setTemplates(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleDownload = async (template: ReportTemplate, format: 'csv' | 'json') => {
    try {
      setDownloading(template.id)

      const response = await fetch(`/api/reports/generate?templateId=${template.id}&format=${format}`)

      if (format === 'csv') {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${template.name}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const { data } = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${template.name}_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchTemplates} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">カスタムレポート</h1>
          <p className="text-muted-foreground">レポートテンプレートの管理と生成</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchTemplates}>
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
          <Button asChild>
            <Link href="/admin/reports/builder">
              <Plus className="h-4 w-4 mr-2" />
              新規作成
            </Link>
          </Button>
        </div>
      </div>

      {/* テンプレート一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </div>
                {template.isPublic ? (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <Globe className="h-3 w-3 mr-1" />
                    公開
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600">
                    <Lock className="h-3 w-3 mr-1" />
                    非公開
                  </Badge>
                )}
              </div>
              {template.description && (
                <CardDescription className="text-sm mt-1">
                  {template.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {/* メトリクス情報 */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.config.metrics
                  .filter((m) => m.enabled)
                  .slice(0, 3)
                  .map((metric) => (
                    <Badge key={metric.id} variant="secondary" className="text-xs">
                      {metric.label}
                    </Badge>
                  ))}
                {template.config.metrics.filter((m) => m.enabled).length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.config.metrics.filter((m) => m.enabled).length - 3}
                  </Badge>
                )}
              </div>

              {/* 期間情報 */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Calendar className="h-4 w-4" />
                <span>
                  {template.config.dateRange.type === 'relative'
                    ? `過去${template.config.dateRange.relativeDays}日`
                    : `${template.config.dateRange.startDate} 〜 ${template.config.dateRange.endDate}`}
                </span>
                <span className="text-gray-300">|</span>
                <BarChart3 className="h-4 w-4" />
                <span>
                  {template.config.groupBy === 'day'
                    ? '日別'
                    : template.config.groupBy === 'week'
                    ? '週別'
                    : '月別'}
                </span>
              </div>

              {/* アクション */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(template, 'csv')}
                  disabled={downloading === template.id}
                >
                  {downloading === template.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(template, 'json')}
                  disabled={downloading === template.id}
                >
                  {downloading === template.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              レポートテンプレートがありません
            </p>
            <Button asChild>
              <Link href="/admin/reports/builder">
                <Plus className="h-4 w-4 mr-2" />
                テンプレートを作成
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
