'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  BarChart3,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { SpreadsheetEditor, type SheetRow } from '@/components/admin/SpreadsheetEditor'
import { AICommandBar } from '@/components/admin/AICommandBar'
import { SheetChart } from '@/components/admin/SheetChart'

import { updateSheet, deleteSheet, type AnalysisSheet, type SheetData } from '../actions'

interface SheetEditorProps {
  sheet: AnalysisSheet
}

export function SheetEditor({ sheet }: SheetEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAILoading, setIsAILoading] = useState(false)

  const [title, setTitle] = useState(sheet.title)
  const [sheetData, setSheetData] = useState<SheetData>(sheet.data)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(null)

  // データ変更ハンドラー
  const handleDataChange = useCallback((columns: string[], rows: SheetRow[]) => {
    setSheetData((prev) => ({
      ...prev,
      columns,
      rows,
    }))
  }, [])

  // 保存
  const handleSave = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateSheet(sheet.id, {
        title,
        data: sheetData,
      })

      if (result.success) {
        setMessage({ type: 'success', text: '保存しました' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.error || '保存に失敗しました' })
      }
    })
  }

  // 削除
  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSheet(sheet.id)

      if (result.success) {
        router.push('/admin/data-analysis')
      } else {
        setMessage({ type: 'error', text: result.error || '削除に失敗しました' })
      }
    })
  }

  // AI実行
  const handleAIExecute = async (command: string) => {
    setIsAILoading(true)
    setMessage(null)
    setAiSummary(null)

    try {
      const response = await fetch('/api/analytics/sheet-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'AIの実行に失敗しました')
      }

      if (result.success && result.data) {
        setSheetData({
          columns: result.data.columns,
          rows: result.data.rows,
          chart: result.data.chart,
        })
        setAiSummary(result.data.summary)
        setMessage({ type: 'success', text: 'データを生成しました' })
      }
    } catch (error) {
      console.error('AI Error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'AIの実行に失敗しました',
      })
    } finally {
      setIsAILoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/data-analysis">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto"
            placeholder="シート名"
          />
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-1" />
                削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>シートを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  この操作は取り消せません。シート「{sheet.title}」を完全に削除します。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            保存
          </Button>
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      {/* AIコマンドバー */}
      <AICommandBar onExecute={handleAIExecute} isLoading={isAILoading} disabled={isPending} />

      {/* AIサマリー */}
      {aiSummary && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <p className="text-sm text-purple-800">
              <strong>📊 AI分析結果:</strong> {aiSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* グラフ */}
      {sheetData.chart && sheetData.rows.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">{sheetData.chart.title || 'グラフ'}</h3>
            </div>
            <SheetChart
              type={sheetData.chart.type}
              data={sheetData.rows}
              dataKeys={sheetData.chart.dataKeys}
              xAxisKey={sheetData.chart.xAxisKey}
            />
          </CardContent>
        </Card>
      )}

      {/* スプレッドシート */}
      <SpreadsheetEditor
        columns={sheetData.columns}
        rows={sheetData.rows}
        onDataChange={handleDataChange}
      />
    </div>
  )
}














