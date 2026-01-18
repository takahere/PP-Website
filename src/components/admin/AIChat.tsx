'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  Search,
  Target,
  Lightbulb,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ClarifyingQuestions,
  ClarifyingQuestion,
  ClarifyingAnswer,
} from './ClarifyingQuestions'
import { HypothesisDisplay } from './HypothesisDisplay'
import { AgentThinkingIndicator } from './AgentThinkingIndicator'
import type { Hypothesis, AgentStreamEvent } from '@/lib/agents/types'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'hypothesis'
  content: string
  hypothesis?: Hypothesis
}

type Phase = 'idle' | 'clarifying' | 'analyzing'

interface ClarifyResponse {
  needsClarification: boolean
  questions: ClarifyingQuestion[]
  readyToAnalyze: boolean
  analysisRequest?: string
  summary?: string
}

// プリセット質問
const presetQuestions = [
  {
    icon: TrendingUp,
    label: '今週のトラフィック',
    question: '今週のトラフィックはどうですか？先週と比較して教えてください。',
  },
  {
    icon: Search,
    label: '検索流入を増やす',
    question: '検索流入を増やすために、今すぐできる施策を3つ教えてください。',
  },
  {
    icon: Target,
    label: '改善すべきページ',
    question: 'パフォーマンスが低く、改善すべきページはどれですか？',
  },
  {
    icon: Lightbulb,
    label: 'コンテンツ提案',
    question: '検索クエリを分析して、新しく作るべきコンテンツを提案してください。',
  },
]

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export function AIChat({ isOpen, onClose, isExpanded = false, onToggleExpand }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Deep Research style clarifying flow
  const [phase, setPhase] = useState<Phase>('idle')
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[]>([])
  const [clarifyingAnswers, setClarifyingAnswers] = useState<ClarifyingAnswer[]>([])
  const [originalRequest, setOriginalRequest] = useState('')
  const [clarifyingSummary, setClarifyingSummary] = useState('')

  // Agent mode state
  const [useAgentMode, setUseAgentMode] = useState(true) // Enable agent mode by default
  const [currentHypothesis, setCurrentHypothesis] = useState<Hypothesis | null>(null)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [thinkingStep, setThinkingStep] = useState<'hypothesis' | 'clarify' | 'fetch' | 'analyze' | 'idle'>('idle')

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // モーダルが開いたら入力にフォーカス
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // モーダル表示時に背景スクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  // プリセット質問をクリック
  const handlePresetClick = (question: string) => {
    setInput(question)
  }

  // 確認質問を取得
  const fetchClarifyingQuestions = async (request: string, answers: ClarifyingAnswer[] = []) => {
    const response = await fetch('/api/analytics/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request, answers }),
    })

    if (!response.ok) {
      throw new Error('Failed to get clarifying questions')
    }

    return response.json() as Promise<ClarifyResponse>
  }

  // 分析を実行
  const executeAnalysis = async (analysisRequest: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: analysisRequest,
    }

    setMessages((prev) => [...prev, userMessage])
    setPhase('analyzing')

    try {
      const response = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantContent += chunk

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: assistantContent }
                : m
            )
          )
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '申し訳ございません。エラーが発生しました。もう一度お試しください。',
        },
      ])
    } finally {
      setPhase('idle')
      setClarifyingQuestions([])
      setClarifyingAnswers([])
      setOriginalRequest('')
      setClarifyingSummary('')
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

      if (result.readyToAnalyze && result.analysisRequest) {
        await executeAnalysis(result.analysisRequest)
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

  // Agent mode: エージェントを使用したストリーミング処理
  const executeAgentAnalysis = async (userRequest: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userRequest,
    }

    setMessages((prev) => [...prev, userMessage])
    setThinkingStep('hypothesis')

    try {
      const response = await fetch('/api/analytics/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userRequest,
          sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Agent API error')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (reader) {
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Parse SSE events
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              const eventType = line.replace('event: ', '').trim()
              // Update thinking step based on event
              if (eventType === 'hypothesis') setThinkingStep('hypothesis')
              else if (eventType === 'clarify') setThinkingStep('clarify')
              else if (eventType === 'data') setThinkingStep('fetch')
              else if (eventType === 'content') setThinkingStep('analyze')
            } else if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.replace('data: ', ''))
                const event = data as AgentStreamEvent

                switch (event.type) {
                  case 'hypothesis':
                    setCurrentHypothesis(event.data as Hypothesis)
                    break
                  case 'clarify':
                    setClarifyingQuestions(event.data as ClarifyingQuestion[])
                    setPhase('clarifying')
                    break
                  case 'content':
                    assistantContent += event.data as string
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessage.id
                          ? { ...m, content: assistantContent }
                          : m
                      )
                    )
                    break
                  case 'done':
                    if (event.data && typeof event.data === 'object' && 'sessionId' in event.data) {
                      setSessionId(event.data.sessionId as string)
                    }
                    break
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Agent error:', error)
      // Fallback to regular analysis
      await executeAnalysis(userRequest)
    } finally {
      setThinkingStep('idle')
    }
  }

  // 仮説を確認して分析を続行
  const handleHypothesisConfirm = async () => {
    if (!currentHypothesis) return
    setCurrentHypothesis(null)
    setThinkingStep('fetch')
    // Continue with analysis using the confirmed hypothesis
    await executeAgentAnalysis(`${currentHypothesis.interpretedIntent}について分析してください`)
  }

  // 仮説の詳細を聞く
  const handleHypothesisRefine = async () => {
    if (!currentHypothesis) return
    setCurrentHypothesis(null)
    setThinkingStep('clarify')
    // Request more clarification
    await executeAgentAnalysis(`もう少し詳しく聞かせてください。${originalRequest}`)
  }

  // メッセージ送信
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userRequest = input.trim()
    setInput('')
    setIsLoading(true)
    setOriginalRequest(userRequest)

    try {
      // Use agent mode if enabled and API key is configured
      if (useAgentMode) {
        await executeAgentAnalysis(userRequest)
      } else {
        // Fallback to original clarify flow
        const result = await fetchClarifyingQuestions(userRequest)

        if (result.needsClarification && result.questions.length > 0) {
          setClarifyingQuestions(result.questions)
          setClarifyingAnswers([])
          setClarifyingSummary('')
          setPhase('clarifying')

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'user',
              content: userRequest,
            },
          ])
        } else if (result.readyToAnalyze && result.analysisRequest) {
          await executeAnalysis(result.analysisRequest)
        } else {
          await executeAnalysis(userRequest)
        }
      }
    } catch (error) {
      console.error('Submit error:', error)
      await executeAnalysis(userRequest)
    } finally {
      setIsLoading(false)
      setPhase('idle')
    }
  }

  // マークダウンを簡易的にレンダリング
  const renderMarkdown = (content: string) => {
    return content.split('\n').map((line, i) => {
      // 見出し
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} className="text-base font-semibold mt-3 mb-1">
            {line.replace('### ', '')}
          </h3>
        )
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} className="text-lg font-semibold mt-4 mb-2">
            {line.replace('## ', '')}
          </h2>
        )
      }
      // 太字
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.+?)\*\*/g)
        return (
          <p key={i} className="my-1">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j}>{part}</strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        )
      }
      // リスト
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={i} className="ml-4 my-0.5">
            {line.replace(/^[-*] /, '')}
          </li>
        )
      }
      // 番号付きリスト
      if (line.match(/^\d+\./)) {
        return (
          <li key={i} className="ml-4 my-0.5 list-decimal">
            {line.replace(/^\d+\.\s*/, '')}
          </li>
        )
      }
      // 空行
      if (line.trim() === '') {
        return <br key={i} />
      }
      // 通常のテキスト
      return (
        <p key={i} className="my-1">
          {line}
        </p>
      )
    })
  }

  return (
    <>
      {/* オーバーレイ */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* モーダル本体 - 画面中央に配置 */}
      <div 
        className={cn(
          "fixed z-50 bg-white rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 fade-in duration-200",
          isExpanded 
            ? "inset-4 md:inset-8" 
            : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[90vw] h-[650px] max-h-[85vh]"
        )}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">AI アシスタント</h2>
              <p className="text-white/70 text-xs">アナリティクスについて質問</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isExpanded ? '縮小' : '拡大'}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="閉じる"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            // 初期状態: プリセット質問を表示
            <div className="h-full flex flex-col items-center justify-center">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-6">
                何でも聞いてください！<br />
                以下のボタンからも質問できます
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {presetQuestions.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    className="h-auto py-3 px-4 flex flex-col items-start gap-1 text-left"
                    onClick={() => handlePresetClick(preset.question)}
                  >
                    <div className="flex items-center gap-2">
                      <preset.icon className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{preset.label}</span>
                    </div>
                  </Button>
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
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-2',
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    )}
                  >
                    {message.role === 'user' ? (
                      <p>{message.content}</p>
                    ) : (
                      <div className="text-sm leading-relaxed">
                        {renderMarkdown(message.content)}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              {/* 仮説表示 */}
              {currentHypothesis && (
                <HypothesisDisplay
                  hypothesis={currentHypothesis}
                  onConfirm={handleHypothesisConfirm}
                  onRefine={handleHypothesisRefine}
                  isLoading={isLoading}
                />
              )}
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
              {/* エージェント思考インジケータ */}
              {isLoading && thinkingStep !== 'idle' && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <AgentThinkingIndicator step={thinkingStep} />
                  </div>
                </div>
              )}
              {isLoading && thinkingStep === 'idle' && messages[messages.length - 1]?.role === 'user' && phase !== 'clarifying' && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* プリセットボタン（メッセージがある場合は小さく表示） */}
        {messages.length > 0 && (
          <div className="px-4 py-2 border-t bg-gray-50 flex gap-2 overflow-x-auto">
            {presetQuestions.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="flex-shrink-0 text-xs"
                onClick={() => handlePresetClick(preset.question)}
                disabled={isLoading}
              >
                <preset.icon className="h-3 w-3 mr-1" />
                {preset.label}
              </Button>
            ))}
          </div>
        )}

          {/* 入力エリア */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t bg-white flex gap-2 rounded-b-xl"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="質問を入力... (ESCで閉じる)"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}

// ヘッダー用ボタンコンポーネント
export function AIChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow hover:shadow-md transition-all duration-200"
    >
      <Sparkles className="h-4 w-4 text-white" />
      <span className="font-medium text-sm">AI アシスタント</span>
    </button>
  )
}
