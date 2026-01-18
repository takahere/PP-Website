'use client'

import { useState } from 'react'
import { Bot, Check, PenLine, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ClarifyingQuestion {
  id: string
  question: string
  options: { label: string; value: string }[]
  allowCustom: boolean
}

export interface ClarifyingAnswer {
  questionId: string
  answer: string
}

interface ClarifyingQuestionsProps {
  questions: ClarifyingQuestion[]
  answers: ClarifyingAnswer[]
  onAnswer: (questionId: string, answer: string) => void
  onSubmit: () => void
  onAddMore: () => void
  isLoading?: boolean
  summary?: string
}

export function ClarifyingQuestions({
  questions,
  answers,
  onAnswer,
  onSubmit,
  onAddMore,
  isLoading = false,
  summary,
}: ClarifyingQuestionsProps) {
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({})

  const getAnswer = (questionId: string) => {
    return answers.find((a) => a.questionId === questionId)?.answer
  }

  const handleOptionClick = (questionId: string, value: string) => {
    if (value === '__custom__') {
      setShowCustomInput((prev) => ({ ...prev, [questionId]: true }))
    } else {
      setShowCustomInput((prev) => ({ ...prev, [questionId]: false }))
      onAnswer(questionId, value)
    }
  }

  const handleCustomSubmit = (questionId: string) => {
    const customValue = customInputs[questionId]?.trim()
    if (customValue) {
      onAnswer(questionId, customValue)
      setShowCustomInput((prev) => ({ ...prev, [questionId]: false }))
    }
  }

  const allQuestionsAnswered = questions.every((q) => getAnswer(q.id))

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 bg-white border rounded-lg px-4 py-3">
          <p className="text-sm font-medium text-gray-900">
            いくつか確認させてください
          </p>
          <p className="text-xs text-gray-500 mt-1">
            分析内容をより正確にするため、以下の質問にお答えください
          </p>
        </div>
      </div>

      {/* 質問リスト */}
      <div className="space-y-4 pl-10">
        {questions.map((question) => {
          const currentAnswer = getAnswer(question.id)
          const isCustomMode = showCustomInput[question.id]

          return (
            <div key={question.id} className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{question.question}</p>

              {/* 選択肢 */}
              <div className="flex flex-wrap gap-2">
                {question.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick(question.id, option.value)}
                    disabled={isLoading}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full border transition-all',
                      currentAnswer === option.value
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    )}
                  >
                    {currentAnswer === option.value && (
                      <Check className="inline-block h-3 w-3 mr-1" />
                    )}
                    {option.label}
                  </button>
                ))}

                {/* その他ボタン */}
                {question.allowCustom && (
                  <button
                    onClick={() => handleOptionClick(question.id, '__custom__')}
                    disabled={isLoading}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full border transition-all flex items-center gap-1',
                      isCustomMode || (currentAnswer && !question.options.find((o) => o.value === currentAnswer))
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    )}
                  >
                    <PenLine className="h-3 w-3" />
                    その他
                  </button>
                )}
              </div>

              {/* カスタム入力 */}
              {isCustomMode && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={customInputs[question.id] || ''}
                    onChange={(e) =>
                      setCustomInputs((prev) => ({
                        ...prev,
                        [question.id]: e.target.value,
                      }))
                    }
                    placeholder="具体的に入力してください..."
                    className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCustomSubmit(question.id)
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCustomSubmit(question.id)}
                    disabled={!customInputs[question.id]?.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    決定
                  </Button>
                </div>
              )}

              {/* カスタム回答表示 */}
              {currentAnswer &&
                !question.options.find((o) => o.value === currentAnswer) &&
                !isCustomMode && (
                  <div className="text-sm text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg inline-block">
                    <Check className="inline-block h-3 w-3 mr-1" />
                    {currentAnswer}
                  </div>
                )}
            </div>
          )
        })}
      </div>

      {/* サマリー */}
      {summary && allQuestionsAnswered && (
        <div className="pl-10">
          <div className="bg-gray-50 border rounded-lg px-4 py-3 text-sm text-gray-700">
            <p className="font-medium mb-1">分析内容</p>
            <p className="whitespace-pre-wrap">{summary}</p>
          </div>
        </div>
      )}

      {/* アクションボタン */}
      {allQuestionsAnswered && (
        <div className="pl-10 flex gap-2">
          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Check className="h-4 w-4 mr-1" />
            この内容で分析
          </Button>
          <Button
            variant="outline"
            onClick={onAddMore}
            disabled={isLoading}
          >
            <ChevronRight className="h-4 w-4 mr-1" />
            条件を追加
          </Button>
        </div>
      )}
    </div>
  )
}
