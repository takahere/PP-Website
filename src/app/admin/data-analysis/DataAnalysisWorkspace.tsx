'use client'

import { useState, useCallback, useTransition } from 'react'
import { Plus, X, Table2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { SpreadsheetEditor, type SheetRow } from '@/components/admin/SpreadsheetEditor'
import { SheetChart } from '@/components/admin/SheetChart'
import { AISidePanel } from './AISidePanel'

import {
  createSheet,
  updateSheet,
  deleteSheet,
  type AnalysisSheet,
  type SheetData,
} from './actions'

interface DataAnalysisWorkspaceProps {
  initialSheets: AnalysisSheet[]
}

export function DataAnalysisWorkspace({ initialSheets }: DataAnalysisWorkspaceProps) {
  const [sheets, setSheets] = useState<AnalysisSheet[]>(initialSheets)
  const [activeSheetId, setActiveSheetId] = useState<string | null>(
    initialSheets.length > 0 ? initialSheets[0].id : null
  )
  const [isPending, startTransition] = useTransition()
  const [isCreating, setIsCreating] = useState(false)
  const [newSheetName, setNewSheetName] = useState('')
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null)
  const [editingSheetName, setEditingSheetName] = useState('')
  
  // ドラッグ&ドロップ用の状態
  const [draggedSheetId, setDraggedSheetId] = useState<string | null>(null)
  const [dragOverSheetId, setDragOverSheetId] = useState<string | null>(null)

  // アクティブなシートを取得
  const activeSheet = sheets.find((s) => s.id === activeSheetId) || null

  // 新規シート作成
  const handleCreateSheet = useCallback(() => {
    if (!newSheetName.trim()) return

    startTransition(async () => {
      const result = await createSheet(newSheetName.trim())
      if (result.success && result.data) {
        setSheets((prev) => [result.data!, ...prev])
        setActiveSheetId(result.data.id)
        setNewSheetName('')
        setIsCreating(false)
      }
    })
  }, [newSheetName])

  // シート削除
  const handleDeleteSheet = useCallback((sheetId: string) => {
    startTransition(async () => {
      const result = await deleteSheet(sheetId)
      if (result.success) {
        setSheets((prev) => {
          const newSheets = prev.filter((s) => s.id !== sheetId)
          // 削除したシートがアクティブだった場合、次のシートをアクティブに
          if (activeSheetId === sheetId) {
            setActiveSheetId(newSheets.length > 0 ? newSheets[0].id : null)
          }
          return newSheets
        })
      }
    })
  }, [activeSheetId])

  // シート名変更開始
  const handleStartRename = useCallback((sheet: AnalysisSheet) => {
    setEditingSheetId(sheet.id)
    setEditingSheetName(sheet.title)
  }, [])

  // シート名変更確定
  const handleFinishRename = useCallback(() => {
    if (!editingSheetId || !editingSheetName.trim()) {
      setEditingSheetId(null)
      setEditingSheetName('')
      return
    }

    // ローカル状態を即座に更新
    setSheets((prev) =>
      prev.map((s) =>
        s.id === editingSheetId ? { ...s, title: editingSheetName.trim() } : s
      )
    )

    // バックグラウンドで保存
    startTransition(async () => {
      await updateSheet(editingSheetId, { title: editingSheetName.trim() })
    })

    setEditingSheetId(null)
    setEditingSheetName('')
  }, [editingSheetId, editingSheetName])

  // シートデータ更新
  const handleUpdateSheetData = useCallback(
    (sheetId: string, newData: SheetData) => {
      // ローカル状態を即座に更新
      setSheets((prev) =>
        prev.map((s) => (s.id === sheetId ? { ...s, data: newData } : s))
      )

      // バックグラウンドで保存
      startTransition(async () => {
        await updateSheet(sheetId, { data: newData })
      })
    },
    []
  )

  // スプレッドシートデータ変更
  const handleSpreadsheetChange = useCallback(
    (columns: string[], rows: SheetRow[]) => {
      if (!activeSheet) return

      const newData: SheetData = {
        ...activeSheet.data,
        columns,
        rows,
      }
      handleUpdateSheetData(activeSheet.id, newData)
    },
    [activeSheet, handleUpdateSheetData]
  )

  // AIからのデータ更新
  const handleAIDataUpdate = useCallback(
    (newData: SheetData) => {
      if (!activeSheet) return
      handleUpdateSheetData(activeSheet.id, newData)
    },
    [activeSheet, handleUpdateSheetData]
  )

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, sheetId: string) => {
    setDraggedSheetId(sheetId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', sheetId)
  }, [])

  // ドラッグオーバー
  const handleDragOver = useCallback((e: React.DragEvent, sheetId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSheetId(sheetId)
  }, [])

  // ドラッグ終了
  const handleDragEnd = useCallback(() => {
    setDraggedSheetId(null)
    setDragOverSheetId(null)
  }, [])

  // ドロップ
  const handleDrop = useCallback((e: React.DragEvent, dropTargetId: string) => {
    e.preventDefault()
    
    if (!draggedSheetId || draggedSheetId === dropTargetId) {
      setDraggedSheetId(null)
      setDragOverSheetId(null)
      return
    }

    setSheets((prevSheets) => {
      const newSheets = [...prevSheets]
      const draggedIndex = newSheets.findIndex((s) => s.id === draggedSheetId)
      const targetIndex = newSheets.findIndex((s) => s.id === dropTargetId)

      if (draggedIndex === -1 || targetIndex === -1) return prevSheets

      // 配列の要素を入れ替え
      const [draggedSheet] = newSheets.splice(draggedIndex, 1)
      newSheets.splice(targetIndex, 0, draggedSheet)

      return newSheets
    })

    setDraggedSheetId(null)
    setDragOverSheetId(null)
  }, [draggedSheetId])

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* ヘッダー */}

      {/* タブバー */}
      <div className="flex items-center gap-1 border-b bg-gray-50 px-2 py-1 rounded-t-lg">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            draggable={editingSheetId !== sheet.id}
            onDragStart={(e) => handleDragStart(e, sheet.id)}
            onDragOver={(e) => handleDragOver(e, sheet.id)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, sheet.id)}
            className={cn(
              'group flex items-center gap-2 px-3 py-1.5 rounded-t-md text-sm cursor-move transition-all',
              activeSheetId === sheet.id
                ? 'bg-white border border-b-white -mb-px text-gray-900 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
              draggedSheetId === sheet.id && 'opacity-50',
              dragOverSheetId === sheet.id && draggedSheetId !== sheet.id && 'border-l-2 border-l-blue-500'
            )}
            onClick={() => setActiveSheetId(sheet.id)}
            onDoubleClick={(e) => {
              e.stopPropagation()
              handleStartRename(sheet)
            }}
          >
            <Table2 className="h-3.5 w-3.5 flex-shrink-0" />
            {editingSheetId === sheet.id ? (
              <Input
                value={editingSheetName}
                onChange={(e) => setEditingSheetName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename()
                  if (e.key === 'Escape') {
                    setEditingSheetId(null)
                    setEditingSheetName('')
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-5 w-24 text-sm px-1 py-0"
                autoFocus
              />
            ) : (
              <span className="max-w-[120px] truncate" title="ダブルクリックで名前を編集">
                {sheet.title}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteSheet(sheet.id)
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded transition-opacity"
              title="シートを削除"
            >
              <X className="h-3 w-3 text-red-500" />
            </button>
          </div>
        ))}

        {/* 新規シート作成 */}
        {isCreating ? (
          <div className="flex items-center gap-1 px-2">
            <Input
              value={newSheetName}
              onChange={(e) => setNewSheetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSheet()
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewSheetName('')
                }
              }}
              placeholder="シート名"
              className="h-7 w-32 text-sm"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={handleCreateSheet}
              disabled={!newSheetName.trim() || isPending}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                '作成'
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => {
                setIsCreating(false)
                setNewSheetName('')
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>新規</span>
          </button>
        )}
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex border border-t-0 rounded-b-lg bg-white overflow-hidden">
        {activeSheet ? (
          <>
            {/* 左側: スプレッドシート */}
            <div className="flex-1 flex flex-col overflow-hidden border-r">
              {/* スプレッドシート */}
              <div className="flex-1 overflow-auto p-4">
                <SpreadsheetEditor
                  columns={activeSheet.data.columns}
                  rows={activeSheet.data.rows}
                  onDataChange={handleSpreadsheetChange}
                />
              </div>

              {/* グラフ */}
              {activeSheet.data.chart && activeSheet.data.rows.length > 0 && (
                <div className="border-t p-4 bg-gray-50">
                  <h3 className="text-sm font-medium mb-2">
                    {activeSheet.data.chart.title || 'グラフ'}
                  </h3>
                  <SheetChart
                    type={activeSheet.data.chart.type}
                    data={activeSheet.data.rows}
                    dataKeys={activeSheet.data.chart.dataKeys}
                    xAxisKey={activeSheet.data.chart.xAxisKey}
                  />
                </div>
              )}
            </div>

            {/* 右側: AIパネル */}
            <AISidePanel onDataUpdate={handleAIDataUpdate} />
          </>
        ) : (
          // シートがない場合
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Table2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                シートがありません
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                「+ 新規」ボタンからシートを作成してください
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                最初のシートを作成
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

