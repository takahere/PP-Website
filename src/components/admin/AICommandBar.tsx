'use client'

import { useState, useRef } from 'react'
import { Sparkles, Send, Loader2, Lightbulb } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AICommandBarProps {
  onExecute: (command: string) => Promise<void>
  isLoading?: boolean
  disabled?: boolean
}

// プリセットコマンド
const presetCommands = [
  { label: '過去30日のPV推移', command: '過去30日のページビュー数を日別で表にしてください' },
  { label: '検索キーワードTOP10', command: '検索クエリのクリック数TOP10を表にしてください' },
  { label: 'ページ別パフォーマンス', command: 'ページ別のPV数、滞在時間、直帰率を表にしてください' },
  { label: '流入チャネル分析', command: '流入チャネル別のユーザー数とセッション数を表にしてください' },
]

export function AICommandBar({ onExecute, isLoading = false, disabled = false }: AICommandBarProps) {
  const [command, setCommand] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim() || isLoading || disabled) return

    await onExecute(command.trim())
    setCommand('')
  }

  const handlePresetClick = (presetCommand: string) => {
    setCommand(presetCommand)
    setShowPresets(false)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-2">
      {/* メイン入力 */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-2 text-purple-600">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">AIに指示:</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onFocus={() => setShowPresets(true)}
            onBlur={() => setTimeout(() => setShowPresets(false), 200)}
            placeholder="例: 過去30日のPV推移を表にしてください"
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
            disabled={isLoading || disabled}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!command.trim() || isLoading || disabled}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                実行
              </>
            )}
          </Button>
        </div>
      </form>

      {/* プリセットコマンド */}
      <div
        className={cn(
          'grid grid-cols-2 md:grid-cols-4 gap-2 transition-all duration-200',
          showPresets ? 'opacity-100 max-h-40' : 'opacity-70 max-h-40'
        )}
      >
        {presetCommands.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePresetClick(preset.command)}
            disabled={isLoading || disabled}
            className="flex items-center gap-2 px-3 py-2 text-xs text-left rounded-md border bg-white hover:bg-gray-50 hover:border-purple-300 transition-colors disabled:opacity-50"
          >
            <Lightbulb className="h-3 w-3 text-yellow-500 flex-shrink-0" />
            <span className="truncate">{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}














