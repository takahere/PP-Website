'use client'

import { Lightbulb, CheckCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Hypothesis } from '@/lib/agents/types'

interface HypothesisDisplayProps {
  hypothesis: Hypothesis
  onConfirm: () => void
  onRefine: () => void
  isLoading?: boolean
}

export function HypothesisDisplay({
  hypothesis,
  onConfirm,
  onRefine,
  isLoading = false,
}: HypothesisDisplayProps) {
  const confidencePercent = Math.round(hypothesis.confidence * 100)

  // Determine confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-orange-600 bg-orange-100'
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-indigo-600" />
          <span className="font-medium text-indigo-900">AIの仮説</span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${getConfidenceColor(hypothesis.confidence)}`}
        >
          信頼度: {confidencePercent}%
        </span>
      </div>

      {/* Interpreted Intent */}
      <div className="space-y-1">
        <p className="text-sm text-gray-700">{hypothesis.interpretedIntent}</p>
      </div>

      {/* Data Sources */}
      {hypothesis.relevantDataSources.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hypothesis.relevantDataSources.map((source) => (
            <span
              key={source}
              className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded"
            >
              {source}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          この方向で分析
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefine}
          disabled={isLoading}
          className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
        >
          <HelpCircle className="h-3 w-3 mr-1" />
          詳しく聞く
        </Button>
      </div>

      {/* Low confidence warning */}
      {hypothesis.confidence < 0.6 && (
        <p className="text-xs text-orange-600 mt-2">
          ※ 信頼度が低いため、追加の質問をおすすめします
        </p>
      )}
    </div>
  )
}

export default HypothesisDisplay
