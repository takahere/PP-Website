'use client'

import { Loader2, Brain, MessageCircleQuestion, Database, BarChart3 } from 'lucide-react'

type ThinkingStep = 'hypothesis' | 'clarify' | 'fetch' | 'analyze' | 'idle'

interface AgentThinkingIndicatorProps {
  step: ThinkingStep
  className?: string
}

const STEP_CONFIG = {
  hypothesis: {
    icon: Brain,
    text: '仮説を立てています...',
    color: 'text-purple-600',
  },
  clarify: {
    icon: MessageCircleQuestion,
    text: '確認事項を整理中...',
    color: 'text-blue-600',
  },
  fetch: {
    icon: Database,
    text: 'データを取得中...',
    color: 'text-green-600',
  },
  analyze: {
    icon: BarChart3,
    text: '分析中...',
    color: 'text-orange-600',
  },
  idle: {
    icon: Loader2,
    text: '処理中...',
    color: 'text-gray-600',
  },
}

export function AgentThinkingIndicator({
  step,
  className = '',
}: AgentThinkingIndicatorProps) {
  const config = STEP_CONFIG[step]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative ${config.color}`}>
        <Icon className="h-4 w-4 animate-pulse" />
        <Loader2 className="h-4 w-4 animate-spin absolute inset-0 opacity-30" />
      </div>
      <span className={`text-sm ${config.color}`}>{config.text}</span>
    </div>
  )
}

// Compact version for inline use
export function AgentThinkingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

export default AgentThinkingIndicator
