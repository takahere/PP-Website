'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  TrendingUp,
  Search,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SheetData } from './actions'
import {
  ClarifyingQuestions,
  ClarifyingQuestion,
  ClarifyingAnswer,
} from '@/components/admin/ClarifyingQuestions'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sheetData?: SheetData
}

type Phase = 'idle' | 'clarifying' | 'analyzing'

interface ClarifyResponse {
  needsClarification: boolean
  questions: ClarifyingQuestion[]
  readyToAnalyze: boolean
  analysisRequest?: string
  summary?: string
  dataSources?: string[]
}

interface AISidePanelProps {
  onDataUpdate: (data: SheetData) => void
}

// プリセットコマンド
const presetCommands = [
  {
    icon: TrendingUp,
    label: 'PV推移',
    command: '過去30日のページビュー数を日別で表にしてください',
  },
  {
    icon: Search,
    label: '検索キーワード',
    command: '検索クエリのクリック数TOP10を表にしてください',
  },
  {
    icon: FileSpreadsheet,
    label: 'ページ別分析',
    command: 'ページ別のPV数、滞在時間、直帰率を表にしてください',
  },
  {
    icon: BarChart3,
    label: '流入チャネル',
    command: '流入チャネル別のユーザー数とセッション数を表にしてください',
  },
]

export function AISidePanel({ onDataUpdate }: AISidePanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Deep Research style clarifying flow
  const [phase, setPhase] = useState<Phase>('idle')
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[]>([])
  const [clarifyingAnswers, setClarifyingAnswers] = useState<ClarifyingAnswer[]>([])
  const [originalRequest, setOriginalRequest] = useState('')
  const [clarifyingSummary, setClarifyingSummary] = useState('')
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([])

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // プリセットコマンドをクリック
  const handlePresetClick = (command: string) => {
    setInput(command)
    inputRef.current?.focus()
  }

  // 確認質問を取得
  const fetchClarifyingQuestions = async (request: string, answers: ClarifyingAnswer[] = []) => {
    const response = await fetch('/api/analytics/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request, answers }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Clarify API error:', errorData)
      throw new Error(errorData.message || errorData.error || 'Failed to get clarifying questions')
    }

    return response.json() as Promise<ClarifyResponse>
  }

  // 分析を実行
  const executeAnalysis = async (analysisRequest: string, dataSources?: string[]) => {
    setPhase('analyzing')

    try {
      const response = await fetch('/api/analytics/sheet-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: analysisRequest,
          dataSources: dataSources || selectedDataSources,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'エラーが発生しました')
      }

      if (result.success && result.data) {
        const sheetData: SheetData = {
          columns: result.data.columns,
          rows: result.data.rows,
          chart: result.data.chart,
        }

        onDataUpdate(sheetData)

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.summary || 'データを生成しました。シートに反映しました。',
          sheetData,
        }

        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('AI Error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `エラー: ${error instanceof Error ? error.message : '予期せぬエラーが発生しました'}`,
        },
      ])
    } finally {
      setPhase('idle')
      setClarifyingQuestions([])
      setClarifyingAnswers([])
      setOriginalRequest('')
      setClarifyingSummary('')
      setSelectedDataSources([])
    }
  }

  // 確認質問に回答
  const handleClarifyingAnswer = (questionId: string, answer: string) => {
    setClarifyingAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === questionId)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { questionId, answer }
        return updated
      }
      return [...prev, { questionId, answer }]
    })
  }

  // 確認質問を送信して分析開始
  const handleClarifyingSubmit = async () => {
    setIsLoading(true)
    try {
      const result = await fetchClarifyingQuestions(originalRequest, clarifyingAnswers)

      // dataSourcesを保存
      if (result.dataSources) {
        setSelectedDataSources(result.dataSources)
      }

      if (result.readyToAnalyze && result.analysisRequest) {
        await executeAnalysis(result.analysisRequest, result.dataSources)
      } else if (result.needsClarification && result.questions.length > 0) {
        setClarifyingQuestions(result.questions)
        setClarifyingSummary(result.summary || '')
      }
    } catch (error) {
      console.error('Clarify error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 追加の確認質問をリクエスト
  const handleAddMoreConditions = async () => {
    setIsLoading(true)
    try {
      const result = await fetchClarifyingQuestions(originalRequest, clarifyingAnswers)
      if (result.questions.length > 0) {
        setClarifyingQuestions(result.questions)
        setClarifyingSummary(result.summary || '')
      }
    } catch (error) {
      console.error('Add more conditions error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // メッセージ送信
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userRequest = input.trim()
    setInput('')
    setIsLoading(true)

    // ユーザーのリクエストをメッセージとして追加
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userRequest,
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      // まず確認質問が必要か確認
      const result = await fetchClarifyingQuestions(userRequest)

      // dataSourcesを保存
      if (result.dataSources) {
        setSelectedDataSources(result.dataSources)
      }

      if (result.needsClarification && result.questions.length > 0) {
        // 確認質問が必要な場合
        setOriginalRequest(userRequest)
        setClarifyingQuestions(result.questions)
        setClarifyingAnswers([])
        setClarifyingSummary('')
        setPhase('clarifying')
      } else if (result.readyToAnalyze && result.analysisRequest) {
        // 直接分析可能な場合
        await executeAnalysis(result.analysisRequest, result.dataSources)
      } else {
        // フォールバック: 直接分析実行（デフォルトのデータソースを使用）
        await executeAnalysis(userRequest, ['ga', 'gsc'])
      }
    } catch (error) {
      console.error('Submit error:', error)
      // エラー時は直接分析を試みる（デフォルトのデータソースを使用）
      await executeAnalysis(userRequest, ['ga', 'gsc'])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-[400px] flex flex-col bg-gray-50 border-l">
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">AI分析</h2>
            <p className="text-white/70 text-xs">データを自動生成</p>
          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          // 初期状態: プリセットボタンを表示
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center py-2">
              何を分析しますか？下のボタンをクリックするか、
              自由に入力してください。
            </p>
            <div className="grid grid-cols-2 gap-2">
              {presetCommands.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset.command)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border bg-white hover:bg-purple-50 hover:border-purple-200 transition-colors text-left"
                >
                  <preset.icon className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-medium text-gray-700">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // メッセージ履歴
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border text-gray-700'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.sheetData && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                      ✅ {message.sheetData.rows.length} 行のデータを生成
                      {message.sheetData.chart && ' + グラフ'}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-3 w-3 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {/* 確認質問フェーズ */}
            {phase === 'clarifying' && clarifyingQuestions.length > 0 && (
              <ClarifyingQuestions
                questions={clarifyingQuestions}
                answers={clarifyingAnswers}
                onAnswer={handleClarifyingAnswer}
                onSubmit={handleClarifyingSubmit}
                onAddMore={handleAddMoreConditions}
                isLoading={isLoading}
                summary={clarifyingSummary}
              />
            )}
            {isLoading && phase !== 'clarifying' && (
              <div className="flex gap-2 justify-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <div className="bg-white border rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* プリセットボタン（メッセージがある場合） */}
      {messages.length > 0 && (
        <div className="px-3 py-2 border-t bg-white flex gap-1 overflow-x-auto">
          {presetCommands.map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 text-xs h-7 px-2"
              onClick={() => handlePresetClick(preset.command)}
              disabled={isLoading}
            >
              <preset.icon className="h-3 w-3 mr-1" />
              {preset.label}
            </Button>
          ))}
        </div>
      )}

      {/* 入力エリア */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="space-y-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (input.trim() && !isLoading) {
                  handleSubmit(e)
                }
              }
            }}
            placeholder="分析したい内容を入力...&#10;例: 過去30日のPV推移を教えて&#10;例: 検索キーワードTOP10を表にして"
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Enter で送信 / Shift+Enter で改行</span>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 px-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  送信
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}














