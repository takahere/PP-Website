'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Loader2,
  Plus,
  Trash2,
  Target,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import type { AdConfig, CustomEventConfig } from '@/lib/ads/types'
import { META_PIXEL_EVENTS, createEmptyAdConfig, createCustomEvent } from '@/lib/ads'

interface AdSettingsCardProps {
  pageId: string
  onChange?: (config: AdConfig) => void
}

export function AdSettingsCard({ pageId, onChange }: AdSettingsCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [useGlobal, setUseGlobal] = useState(true)
  const [config, setConfig] = useState<AdConfig>(createEmptyAdConfig())
  const [globalConfig, setGlobalConfig] = useState<AdConfig | null>(null)

  // 設定を取得
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/ads/config/page?pageId=${pageId}`)
        if (!res.ok) throw new Error('Failed to fetch config')
        const { globalSetting, pageSetting } = await res.json()

        if (globalSetting?.config) {
          setGlobalConfig(globalSetting.config)
        }

        if (pageSetting?.config) {
          setConfig(pageSetting.config)
          setUseGlobal(pageSetting.config.useGlobalSettings !== false)
        } else {
          setUseGlobal(true)
        }
      } catch (err) {
        console.error('Failed to fetch ad config:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchConfig()
  }, [pageId])

  // 設定変更時にコールバック
  useEffect(() => {
    if (!isLoading && onChange) {
      onChange({ ...config, useGlobalSettings: useGlobal })
    }
  }, [config, useGlobal, isLoading, onChange])

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            広告設定
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // グローバル設定を使用する場合
  if (useGlobal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            広告設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>グローバル設定を使用</Label>
              <p className="text-xs text-muted-foreground">
                サイト全体の設定を適用
              </p>
            </div>
            <Switch
              checked={useGlobal}
              onCheckedChange={setUseGlobal}
            />
          </div>

          {globalConfig && (
            <div className="text-sm text-muted-foreground space-y-1">
              {globalConfig.googleAds?.conversionId && (
                <p>Google Ads: {globalConfig.googleAds.conversionId}</p>
              )}
              {globalConfig.metaPixel?.pixelId && (
                <p>Meta Pixel: {globalConfig.metaPixel.pixelId}</p>
              )}
              {globalConfig.yahooAds?.conversionId && (
                <p>Yahoo Ads: {globalConfig.yahooAds.conversionId}</p>
              )}
              {!globalConfig.googleAds?.conversionId && !globalConfig.metaPixel?.pixelId && !globalConfig.yahooAds?.conversionId && (
                <p>グローバル設定は未設定です</p>
              )}
            </div>
          )}

          <Link
            href="/admin/settings/ads"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            グローバル設定を編集
            <ExternalLink className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>
    )
  }

  // ページ独自の設定
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          広告設定
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>グローバル設定を使用</Label>
            <p className="text-xs text-muted-foreground">
              オフにするとページ独自の設定
            </p>
          </div>
          <Switch
            checked={useGlobal}
            onCheckedChange={setUseGlobal}
          />
        </div>

        <Accordion type="multiple" className="space-y-2">
          {/* Google Ads */}
          <AccordionItem value="google-ads" className="border rounded-lg">
            <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
              Google Ads
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">コンバージョンID</Label>
                <Input
                  placeholder="AW-XXXXXXXXX"
                  value={config.googleAds?.conversionId || ''}
                  onChange={e => updateGoogleAds('conversionId', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">ページビュー</Label>
                  <Input
                    placeholder="ラベル"
                    value={config.googleAds?.pageViewLabel || ''}
                    onChange={e => updateGoogleAds('pageViewLabel', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">フォーム送信</Label>
                  <Input
                    placeholder="ラベル"
                    value={config.googleAds?.formSubmitLabel || ''}
                    onChange={e => updateGoogleAds('formSubmitLabel', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Meta Pixel */}
          <AccordionItem value="meta-pixel" className="border rounded-lg">
            <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
              Meta Pixel
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Pixel ID</Label>
                <Input
                  placeholder="123456789"
                  value={config.metaPixel?.pixelId || ''}
                  onChange={e => updateMetaPixel('pixelId', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">ページビュー</Label>
                  <Select
                    value={config.metaPixel?.pageViewEvent || 'none'}
                    onValueChange={value => updateMetaPixel('pageViewEvent', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">なし</SelectItem>
                      {META_PIXEL_EVENTS.map(e => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">フォーム送信</Label>
                  <Select
                    value={config.metaPixel?.formSubmitEvent || 'none'}
                    onValueChange={value => updateMetaPixel('formSubmitEvent', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">なし</SelectItem>
                      {META_PIXEL_EVENTS.map(e => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Yahoo Ads */}
          <AccordionItem value="yahoo-ads" className="border rounded-lg">
            <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
              Yahoo Ads
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">コンバージョンID</Label>
                <Input
                  placeholder="ID"
                  value={config.yahooAds?.conversionId || ''}
                  onChange={e => updateYahooAds('conversionId', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">ページビュー</Label>
                  <Input
                    placeholder="ラベル"
                    value={config.yahooAds?.pageViewLabel || ''}
                    onChange={e => updateYahooAds('pageViewLabel', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">フォーム送信</Label>
                  <Input
                    placeholder="ラベル"
                    value={config.yahooAds?.formSubmitLabel || ''}
                    onChange={e => updateYahooAds('formSubmitLabel', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* カスタムイベント */}
          <AccordionItem value="custom-events" className="border rounded-lg">
            <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
              カスタムイベント ({config.customEvents?.length || 0})
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-3">
              {config.customEvents?.map((event, index) => (
                <div key={event.id} className="border rounded p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">イベント {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomEvent(event.id)}
                      className="h-6 w-6 p-0 text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="イベント名"
                      value={event.eventName}
                      onChange={e => updateCustomEvent(event.id, { eventName: e.target.value })}
                      className="h-7 text-xs"
                    />
                    <Input
                      placeholder="セレクタ"
                      value={event.selector}
                      onChange={e => updateCustomEvent(event.id, { selector: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomEvent}
                className="w-full h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                追加
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
