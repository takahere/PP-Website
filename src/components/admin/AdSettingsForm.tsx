'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Settings,
  Target,
  MousePointer,
} from 'lucide-react'
import type { AdConfig, CustomEventConfig } from '@/lib/ads/types'
import { META_PIXEL_EVENTS, createEmptyAdConfig, createCustomEvent } from '@/lib/ads'

export function AdSettingsForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [config, setConfig] = useState<AdConfig>(createEmptyAdConfig())

  // 設定を取得
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/ads/config')
        if (!res.ok) throw new Error('Failed to fetch config')
        const { data, setting } = await res.json()
        if (data) {
          setConfig(data)
          setIsEnabled(setting?.is_enabled ?? true)
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchConfig()
  }, [])

  // 保存
  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/ads/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, isEnabled }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save config')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  // Google Ads 更新
  const updateGoogleAds = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      googleAds: { ...prev.googleAds!, [field]: value },
    }))
  }

  // Meta Pixel 更新
  const updateMetaPixel = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      metaPixel: { ...prev.metaPixel!, [field]: value },
    }))
  }

  // Yahoo Ads 更新
  const updateYahooAds = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      yahooAds: { ...prev.yahooAds!, [field]: value },
    }))
  }

  // カスタムイベント追加
  const addCustomEvent = () => {
    setConfig(prev => ({
      ...prev,
      customEvents: [...(prev.customEvents || []), createCustomEvent()],
    }))
  }

  // カスタムイベント更新
  const updateCustomEvent = (id: string, updates: Partial<CustomEventConfig>) => {
    setConfig(prev => ({
      ...prev,
      customEvents: (prev.customEvents || []).map(e =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }))
  }

  // カスタムイベント削除
  const removeCustomEvent = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customEvents: (prev.customEvents || []).filter(e => e.id !== id),
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">広告設定</h1>
          <p className="text-muted-foreground">
            サイト全体のデフォルト広告タグ・コンバージョン設定
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="global-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
            <Label htmlFor="global-enabled">有効</Label>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            保存
          </Button>
        </div>
      </div>

      {/* メッセージ */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          保存しました
        </div>
      )}

      {/* プラットフォーム設定 */}
      <Accordion type="multiple" defaultValue={['google-ads', 'meta-pixel']} className="space-y-4">
        {/* Google Ads */}
        <AccordionItem value="google-ads" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Google Ads</h3>
                <p className="text-sm text-muted-foreground">
                  コンバージョンID: {config.googleAds?.conversionId || '未設定'}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gads-conversion-id">コンバージョンID</Label>
                  <Input
                    id="gads-conversion-id"
                    placeholder="AW-XXXXXXXXX"
                    value={config.googleAds?.conversionId || ''}
                    onChange={e => updateGoogleAds('conversionId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Google Ads の コンバージョンID（AW-で始まる）
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gads-pageview-label">ページビュー時のラベル</Label>
                  <Input
                    id="gads-pageview-label"
                    placeholder="ページビューラベル"
                    value={config.googleAds?.pageViewLabel || ''}
                    onChange={e => updateGoogleAds('pageViewLabel', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gads-form-label">フォーム送信時のラベル</Label>
                  <Input
                    id="gads-form-label"
                    placeholder="フォーム送信ラベル"
                    value={config.googleAds?.formSubmitLabel || ''}
                    onChange={e => updateGoogleAds('formSubmitLabel', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Meta Pixel */}
        <AccordionItem value="meta-pixel" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Settings className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Meta Pixel (Facebook)</h3>
                <p className="text-sm text-muted-foreground">
                  Pixel ID: {config.metaPixel?.pixelId || '未設定'}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="meta-pixel-id">Pixel ID</Label>
                  <Input
                    id="meta-pixel-id"
                    placeholder="123456789"
                    value={config.metaPixel?.pixelId || ''}
                    onChange={e => updateMetaPixel('pixelId', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="meta-pageview-event">ページビュー時のイベント</Label>
                  <Select
                    value={config.metaPixel?.pageViewEvent || 'none'}
                    onValueChange={value => updateMetaPixel('pageViewEvent', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="イベントを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">なし</SelectItem>
                      {META_PIXEL_EVENTS.map(e => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta-form-event">フォーム送信時のイベント</Label>
                  <Select
                    value={config.metaPixel?.formSubmitEvent || 'none'}
                    onValueChange={value => updateMetaPixel('formSubmitEvent', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="イベントを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">なし</SelectItem>
                      {META_PIXEL_EVENTS.map(e => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Yahoo Ads */}
        <AccordionItem value="yahoo-ads" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Target className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Yahoo Ads</h3>
                <p className="text-sm text-muted-foreground">
                  コンバージョンID: {config.yahooAds?.conversionId || '未設定'}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="yahoo-conversion-id">コンバージョンID</Label>
                  <Input
                    id="yahoo-conversion-id"
                    placeholder="コンバージョンID"
                    value={config.yahooAds?.conversionId || ''}
                    onChange={e => updateYahooAds('conversionId', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="yahoo-pageview-label">ページビュー時のラベル</Label>
                  <Input
                    id="yahoo-pageview-label"
                    placeholder="ページビューラベル"
                    value={config.yahooAds?.pageViewLabel || ''}
                    onChange={e => updateYahooAds('pageViewLabel', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yahoo-form-label">フォーム送信時のラベル</Label>
                  <Input
                    id="yahoo-form-label"
                    placeholder="フォーム送信ラベル"
                    value={config.yahooAds?.formSubmitLabel || ''}
                    onChange={e => updateYahooAds('formSubmitLabel', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* カスタムイベント */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MousePointer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>カスタムイベント</CardTitle>
                <CardDescription>
                  ボタンクリックやフォーム送信などの特定アクションでコンバージョンを発火
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={addCustomEvent}>
              <Plus className="mr-2 h-4 w-4" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!config.customEvents || config.customEvents.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              カスタムイベントはまだ設定されていません
            </div>
          ) : (
            <div className="space-y-4">
              {config.customEvents.map((event, index) => (
                <div key={event.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">イベント {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomEvent(event.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>イベント名</Label>
                      <Input
                        placeholder="cta_click"
                        value={event.eventName}
                        onChange={e => updateCustomEvent(event.id, { eventName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CSSセレクタ</Label>
                      <Input
                        placeholder=".cta-button, #submit-btn"
                        value={event.selector}
                        onChange={e => updateCustomEvent(event.id, { selector: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>トリガー</Label>
                      <Select
                        value={event.eventType || 'click'}
                        onValueChange={value => updateCustomEvent(event.id, { eventType: value as 'click' | 'submit' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="click">クリック</SelectItem>
                          <SelectItem value="submit">フォーム送信</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Google Ads ラベル</Label>
                      <Input
                        placeholder="コンバージョンラベル"
                        value={event.platforms.googleAds?.label || ''}
                        onChange={e => updateCustomEvent(event.id, {
                          platforms: {
                            ...event.platforms,
                            googleAds: { label: e.target.value },
                          },
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Pixel イベント</Label>
                      <Select
                        value={event.platforms.metaPixel?.event || 'none'}
                        onValueChange={value => updateCustomEvent(event.id, {
                          platforms: {
                            ...event.platforms,
                            metaPixel: { event: value === 'none' ? '' : value },
                          },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="イベントを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">なし</SelectItem>
                          {META_PIXEL_EVENTS.map(e => (
                            <SelectItem key={e.value} value={e.value}>
                              {e.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使い方ヒント */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800">
            <strong>使い方:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>ここで設定した値がサイト全体のデフォルトになります</li>
            <li>各ページの編集画面で個別にオーバーライドできます</li>
            <li>カスタムイベントはCSSセレクタで要素を指定し、クリック/送信時に発火します</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
