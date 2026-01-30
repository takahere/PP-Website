'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface SchedulePublishCardProps {
  scheduledAt: string | null | undefined
  isPublished: boolean
  onChange: (scheduledAt: string | null) => void
}

function formatScheduledDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  }).format(date)
}

function isDateInFuture(dateString: string): boolean {
  return new Date(dateString) > new Date()
}

// 初期日時値を計算するヘルパー
function getInitialDateValue(scheduledAt: string | null | undefined): string {
  if (!scheduledAt) return ''
  return new Date(scheduledAt).toISOString().slice(0, 10)
}

function getInitialTimeValue(scheduledAt: string | null | undefined): string {
  if (!scheduledAt) return ''
  return new Date(scheduledAt).toISOString().slice(11, 16)
}

export function SchedulePublishCard({
  scheduledAt,
  isPublished,
  onChange,
}: SchedulePublishCardProps) {
  const [showScheduler, setShowScheduler] = useState(false)
  const [dateValue, setDateValue] = useState(() => getInitialDateValue(scheduledAt))
  const [timeValue, setTimeValue] = useState(() => getInitialTimeValue(scheduledAt))

  // scheduledAtが外部から変更された場合に同期
  useEffect(() => {
    if (scheduledAt) {
      const newDateValue = getInitialDateValue(scheduledAt)
      const newTimeValue = getInitialTimeValue(scheduledAt)
      if (newDateValue !== dateValue) setDateValue(newDateValue)
      if (newTimeValue !== timeValue) setTimeValue(newTimeValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledAt])

  const handleSetSchedule = () => {
    if (!dateValue || !timeValue) return

    const dateTime = new Date(`${dateValue}T${timeValue}`)
    if (dateTime <= new Date()) {
      return // 過去の日時は設定不可
    }

    onChange(dateTime.toISOString())
    setShowScheduler(false)
  }

  const handleClearSchedule = () => {
    onChange(null)
    setDateValue('')
    setTimeValue('')
    setShowScheduler(false)
  }

  // 公開済みの場合
  if (isPublished) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            公開予約
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              公開中
            </Badge>
            <span className="text-sm text-muted-foreground">
              この記事は既に公開されています
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          公開予約
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 予約済みの場合 */}
        {scheduledAt && isDateInFuture(scheduledAt) ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-blue-600 mb-2">予約済み</Badge>
                  <p className="text-sm font-medium text-blue-900">
                    {formatScheduledDate(scheduledAt)}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    この日時に自動的に公開されます
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSchedule}
                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowScheduler(true)}
              className="w-full"
            >
              <Clock className="mr-2 h-4 w-4" />
              日時を変更
            </Button>
          </div>
        ) : (
          <>
            {/* 予約入力フォーム */}
            {showScheduler ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-date">日付</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={dateValue}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDateValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-time">時刻</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={timeValue}
                      onChange={(e) => setTimeValue(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSetSchedule}
                    disabled={!dateValue || !timeValue}
                    className="flex-1"
                  >
                    予約する
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowScheduler(false)
                      setDateValue('')
                      setTimeValue('')
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  指定した日時に自動的に公開します。
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScheduler(true)}
                  className="w-full"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  公開日時を予約
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
