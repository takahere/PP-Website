'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SheetRow {
  [key: string]: string | number | null
}

interface SpreadsheetEditorProps {
  columns: string[]
  rows: SheetRow[]
  onDataChange: (columns: string[], rows: SheetRow[]) => void
  readOnly?: boolean
}

export function SpreadsheetEditor({
  columns,
  rows,
  onDataChange,
  readOnly = false,
}: SpreadsheetEditorProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // 列幅の状態管理（初期値150px）
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(() => {
    const widths: { [key: string]: number } = {}
    columns.forEach((col) => {
      widths[col] = 150
    })
    return widths
  })
  
  // リサイズ中の状態
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState<number>(0)
  const [resizeStartWidth, setResizeStartWidth] = useState<number>(0)

  // 列が追加されたら初期幅を設定
  useEffect(() => {
    setColumnWidths((prev) => {
      const newWidths = { ...prev }
      columns.forEach((col) => {
        if (!(col in newWidths)) {
          newWidths[col] = 150
        }
      })
      return newWidths
    })
  }, [columns])

  // リサイズ開始
  const handleResizeStart = useCallback((e: React.MouseEvent, colKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(colKey)
    setResizeStartX(e.clientX)
    setResizeStartWidth(columnWidths[colKey] || 150)
  }, [columnWidths])

  // リサイズ中
  useEffect(() => {
    if (!resizingColumn) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX
      const newWidth = Math.max(80, resizeStartWidth + diff) // 最小幅80px
      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }))
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth])

  // セル編集開始
  const startEditing = useCallback((rowIndex: number, colIndex: number) => {
    if (readOnly) return
    setEditingCell({ row: rowIndex, col: colIndex })
  }, [readOnly])

  // セル編集終了
  const finishEditing = useCallback(() => {
    setEditingCell(null)
  }, [])

  // セル値更新
  const updateCell = useCallback(
    (rowIndex: number, colKey: string, value: string) => {
      const newRows = [...rows]
      if (!newRows[rowIndex]) {
        newRows[rowIndex] = {}
      }
      const trimmedValue = value.trim()
      const isDateFormat = /^\d{4}-\d{2}-\d{2}/.test(trimmedValue)
      const isPureNumber = /^-?\d+\.?\d*$/.test(trimmedValue)
      
      if (isPureNumber && !isDateFormat && trimmedValue !== '') {
        const numValue = parseFloat(trimmedValue)
        newRows[rowIndex][colKey] = !isNaN(numValue) ? numValue : trimmedValue
      } else {
        newRows[rowIndex][colKey] = trimmedValue
      }
      onDataChange(columns, newRows)
    },
    [columns, rows, onDataChange]
  )

  // 列追加
  const addColumn = useCallback(() => {
    const newColName = String.fromCharCode(65 + columns.length)
    const newColumns = [...columns, newColName]
    setColumnWidths((prev) => ({ ...prev, [newColName]: 150 }))
    onDataChange(newColumns, rows)
  }, [columns, rows, onDataChange])

  // 行追加
  const addRow = useCallback(() => {
    const newRow: SheetRow = {}
    columns.forEach((col) => {
      newRow[col] = ''
    })
    onDataChange(columns, [...rows, newRow])
  }, [columns, rows, onDataChange])

  // 行削除
  const deleteRow = useCallback(
    (rowIndex: number) => {
      const newRows = rows.filter((_, i) => i !== rowIndex)
      onDataChange(columns, newRows)
    },
    [columns, rows, onDataChange]
  )

  // 列削除
  const deleteColumn = useCallback(
    (colIndex: number) => {
      if (columns.length <= 1) return
      const colKey = columns[colIndex]
      const newColumns = columns.filter((_, i) => i !== colIndex)
      const newRows = rows.map((row) => {
        const newRow = { ...row }
        delete newRow[colKey]
        return newRow
      })
      setColumnWidths((prev) => {
        const newWidths = { ...prev }
        delete newWidths[colKey]
        return newWidths
      })
      onDataChange(newColumns, newRows)
    },
    [columns, rows, onDataChange]
  )

  // 編集中のセルにフォーカス
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // キーボードナビゲーション
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const value = e.currentTarget.value
        const colKey = columns[colIndex]
        updateCell(rowIndex, colKey, value)
        finishEditing()
        if (rowIndex < rows.length - 1) {
          setSelectedCell({ row: rowIndex + 1, col: colIndex })
        }
      } else if (e.key === 'Tab') {
        e.preventDefault()
        const value = e.currentTarget.value
        const colKey = columns[colIndex]
        updateCell(rowIndex, colKey, value)
        finishEditing()
        if (colIndex < columns.length - 1) {
          setSelectedCell({ row: rowIndex, col: colIndex + 1 })
        } else if (rowIndex < rows.length - 1) {
          setSelectedCell({ row: rowIndex + 1, col: 0 })
        }
      } else if (e.key === 'Escape') {
        finishEditing()
      }
    },
    [columns, rows.length, finishEditing, updateCell]
  )

  // セルの値を取得
  const getCellValue = (row: SheetRow, colKey: string): string => {
    const value = row[colKey]
    if (value === null || value === undefined) return ''
    return String(value)
  }

  // 数値フォーマット
  const formatCellValue = (value: string | number | null): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'number') {
      return value % 1 === 0
        ? value.toLocaleString()
        : value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    }
    return String(value)
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* ツールバー */}
      {!readOnly && (
        <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
          <Button variant="outline" size="sm" onClick={addColumn}>
            <Plus className="h-3 w-3 mr-1" />
            列追加
          </Button>
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-3 w-3 mr-1" />
            行追加
          </Button>
        </div>
      )}

      {/* スプレッドシート */}
      <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
        <table className="border-collapse" style={{ width: 'auto', minWidth: '100%' }}>
          <colgroup>
            <col style={{ width: '60px', minWidth: '60px' }} />
            {columns.map((col) => (
              <col key={col} style={{ width: `${columnWidths[col] || 150}px`, minWidth: `${columnWidths[col] || 150}px` }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              {/* 行番号ヘッダー */}
              <th className="bg-gray-100 border-b border-r text-center text-xs font-medium text-gray-500 p-2">
                #
              </th>
              {/* 列ヘッダー */}
              {columns.map((col, colIndex) => (
                <th
                  key={col}
                  className="bg-gray-100 border-b border-r text-center text-xs font-medium text-gray-700 p-2 group relative"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{col}</span>
                    {!readOnly && columns.length > 1 && (
                      <button
                        onClick={() => deleteColumn(colIndex)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded transition-opacity"
                        title="列を削除"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </button>
                    )}
                  </div>
                  {/* リサイズハンドル */}
                  <div
                    className={cn(
                      "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors",
                      resizingColumn === col && "bg-blue-500"
                    )}
                    onMouseDown={(e) => handleResizeStart(e, col)}
                    title="ドラッグして列幅を変更"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  データがありません。AIに指示してデータを生成してください。
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="group">
                  {/* 行番号 */}
                  <td className="bg-gray-50 border-b border-r text-center text-xs text-gray-500 p-2">
                    <div className="flex items-center justify-center gap-1">
                      <span>{rowIndex + 1}</span>
                      {!readOnly && (
                        <button
                          onClick={() => deleteRow(rowIndex)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded transition-opacity"
                          title="行を削除"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                  {/* データセル */}
                  {columns.map((col, colIndex) => {
                    const isSelected =
                      selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                    const isEditing =
                      editingCell?.row === rowIndex && editingCell?.col === colIndex
                    const cellValue = getCellValue(row, col)
                    const colWidth = columnWidths[col] || 150

                    return (
                      <td
                        key={`${rowIndex}-${col}`}
                        className={cn(
                          'border-b border-r p-0 relative h-[36px]',
                          isSelected && 'outline outline-2 outline-blue-500 outline-offset-[-2px] z-10',
                          !isEditing && 'cursor-pointer hover:bg-blue-50'
                        )}
                        style={{ width: `${colWidth}px` }}
                        onClick={() => {
                          setSelectedCell({ row: rowIndex, col: colIndex })
                          if (!isEditing && !readOnly) {
                            startEditing(rowIndex, colIndex)
                          }
                        }}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            defaultValue={cellValue}
                            onBlur={(e) => {
                              updateCell(rowIndex, col, e.target.value)
                              finishEditing()
                            }}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            className="h-[36px] px-2 text-sm outline-none bg-white border-none box-border"
                            style={{ width: `${colWidth}px` }}
                          />
                        ) : (
                          <div className="px-2 text-sm h-[36px] flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
                            {formatCellValue(row[col])}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
