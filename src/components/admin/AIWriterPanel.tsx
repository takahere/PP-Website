'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useCompletion } from '@ai-sdk/react'
import {
  Sparkles,
  Loader2,
  ChevronRight,
  Link as LinkIcon,
  RefreshCw,
  Check,
  Copy,
  Wand2,
  FileText,
  AlertCircle,
  TrendingUp,
  Award,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface OutlineItem {
  level: 'h2' | 'h3'
  text: string
  keywords?: string[]
}

interface GeneratedOutline {
  title: string
  description: string
  outline: OutlineItem[]
}

interface LinkSuggestion {
  anchorText: string
  url: string
  articleTitle: string
  reason: string
  insertAfter?: string
  seoScore?: number
  rank?: string
}

// SEOスコア関連の型
interface SEOScoreSummary {
  totalArticles: number
  rankDistribution: { S: number; A: number; B: number; C: number }
  avgScore: number
}

interface SuccessPattern {
  avgH2Count: number
  avgWordCount: number
  commonH2Patterns: string[]
}

interface AIWriterPanelProps {
  onInsertContent: (content: string) => void
  onApplyOutline: (outline: GeneratedOutline) => void
  currentContent?: string
  category?: string
}

export function AIWriterPanel({
  onInsertContent,
  onApplyOutline,
  currentContent = '',
  category,
}: AIWriterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [useEnhanced, setUseEnhanced] = useState(true)

  // Hydration mismatch を防ぐ
  useEffect(() => {
    setIsMounted(true)
  }, [])
  const [generatedOutline, setGeneratedOutline] = useState<GeneratedOutline | null>(null)
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false)
  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [generatedSections, setGeneratedSections] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  // SEOスコア関連の状態
  const [seoSummary, setSeoSummary] = useState<SEOScoreSummary | null>(null)
  const [successPattern, setSuccessPattern] = useState<SuccessPattern | null>(null)
  const [isLoadingSEO, setIsLoadingSEO] = useState(false)

  // activeSectionのrefを保持（onFinishコールバック用）
  const activeSectionRef = useRef<string | null>(null)

  // activeSectionが変更されたらrefも更新
  useEffect(() => {
    activeSectionRef.current = activeSection
  }, [activeSection])

  // SEOデータを取得
  const loadSEOData = useCallback(async () => {
    setIsLoadingSEO(true)
    try {
      const [scoresRes, patternsRes] = await Promise.all([
        fetch('/api/seo/article-scores?limit=10'),
        fetch(`/api/seo/success-patterns?${category ? `category=${category}&` : ''}keyword=${encodeURIComponent(keyword || '')}`),
      ])

      if (scoresRes.ok) {
        const scoresData = await scoresRes.json()
        setSeoSummary(scoresData.summary)
      }

      if (patternsRes.ok) {
        const patternsData = await patternsRes.json()
        if (patternsData.patterns?.basic) {
          setSuccessPattern({
            avgH2Count: patternsData.patterns.basic.avgH2Count || 5,
            avgWordCount: patternsData.patterns.basic.avgWordCount || 3500,
            commonH2Patterns: patternsData.patterns.basic.commonH2Patterns || [],
          })
        }
      }
    } catch (err) {
      console.error('Failed to load SEO data:', err)
    } finally {
      setIsLoadingSEO(false)
    }
  }, [category, keyword])

  // パネルが開いたらSEOデータを取得
  useEffect(() => {
    if (isOpen) {
      loadSEOData()
    }
  }, [isOpen, loadSEOData])

  // セクション執筆用のuseCompletion
  const {
    completion: sectionContent,
    isLoading: isWritingSection,
    complete: writeSection,
  } = useCompletion({
    api: '/api/ai-writer/section',
    onFinish: (prompt, completion) => {
      // refを参照してクロージャ問題を回避
      const currentSection = activeSectionRef.current
      if (currentSection) {
        setGeneratedSections((prev) => ({
          ...prev,
          [currentSection]: completion,
        }))
      }
    },
    onError: (err) => {
      setError(err.message || 'セクション生成に失敗しました')
    },
  })

  // 構成案を生成
  const generateOutline = useCallback(async () => {
    if (!keyword.trim()) return

    setIsGeneratingOutline(true)
    setGeneratedOutline(null)
    setGeneratedSections({})
    setError(null)

    try {
      const response = await fetch('/api/ai-writer/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, useEnhanced, category }),
      })

      if (!response.ok) {
        throw new Error('構成生成に失敗しました')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullText += decoder.decode(value)
        }
      }

      // JSONをパース
      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const outline = JSON.parse(jsonMatch[0])
        setGeneratedOutline(outline)
      }
    } catch (err) {
      console.error('Outline generation failed:', err)
      setError(err instanceof Error ? err.message : '構成生成に失敗しました')
    } finally {
      setIsGeneratingOutline(false)
    }
  }, [keyword, useEnhanced, category])

  // セクションを執筆
  const handleWriteSection = useCallback(
    async (heading: string, index: number) => {
      const sectionKey = `section-${index}`
      setActiveSection(sectionKey)

      await writeSection('', {
        body: {
          heading,
          context: generatedOutline?.title || '',
          previousContent: currentContent,
          useEnhanced,
          category,
        },
      })
    },
    [writeSection, generatedOutline, currentContent, useEnhanced, category]
  )

  // 内部リンクを提案
  const suggestLinks = useCallback(async () => {
    if (!currentContent.trim()) return

    setIsLoadingLinks(true)
    setLinkSuggestions([])
    setError(null)

    try {
      const response = await fetch('/api/ai-writer/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentContent, useEnhanced }),
      })

      const data = await response.json()
      setLinkSuggestions(data.suggestions || [])
      if (data.error) {
        setError(data.error)
      } else if (data.warning) {
        setError(data.warning)
      }
    } catch (err) {
      console.error('Link suggestion failed:', err)
      setError(err instanceof Error ? err.message : 'リンク提案に失敗しました')
    } finally {
      setIsLoadingLinks(false)
    }
  }, [currentContent, useEnhanced])

  // コンテンツをクリップボードにコピー
  const copyToClipboard = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }, [])

  // 構成をエディタに適用
  const applyOutlineToEditor = useCallback(() => {
    if (!generatedOutline) return
    onApplyOutline(generatedOutline)
    setIsOpen(false)
  }, [generatedOutline, onApplyOutline])

  // 現在のセクションのコンテンツを取得
  const getCurrentSectionContent = (index: number): string => {
    const sectionKey = `section-${index}`
    if (activeSection === sectionKey && sectionContent) {
      return sectionContent
    }
    return generatedSections[sectionKey] || ''
  }

  // SSR時はボタンのみ表示
  if (!isMounted) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <Sparkles className="h-4 w-4 text-purple-500" />
        AIで書く
      </Button>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          AIで書く
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:w-[600px] sm:max-w-none">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Writer
          </SheetTitle>
          <SheetDescription>
            キーワードから構成案を生成し、各セクションを自動執筆します
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] pr-4 mt-6">
          <div className="space-y-6">
            {/* エラー表示 */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="mt-2"
                  >
                    閉じる
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* SEOスコアサマリー */}
            {isLoadingSEO && (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600 mr-2" />
                  <span className="text-sm text-muted-foreground">SEOデータを読み込み中...</span>
                </CardContent>
              </Card>
            )}
            {!isLoadingSEO && seoSummary && (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    SEOスコア分析
                    <Badge variant="outline" className="ml-auto text-xs">
                      {seoSummary.totalArticles}記事
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">平均スコア</span>
                    <span className="font-bold text-lg">{seoSummary.avgScore}</span>
                  </div>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="bg-amber-500 hover:bg-amber-600">
                            <Award className="h-3 w-3 mr-1" />
                            S: {seoSummary.rankDistribution.S}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>スコア85+</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Badge variant="secondary">A: {seoSummary.rankDistribution.A}</Badge>
                    <Badge variant="outline">B: {seoSummary.rankDistribution.B}</Badge>
                    <Badge variant="outline" className="text-muted-foreground">C: {seoSummary.rankDistribution.C}</Badge>
                  </div>
                  {successPattern && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <p>成功記事の平均: H2 {successPattern.avgH2Count}個 / {successPattern.avgWordCount}文字</p>
                      {successPattern.commonH2Patterns.length > 0 && (
                        <p className="mt-1">よく使われるパターン: {successPattern.commonH2Patterns.slice(0, 3).join('、')}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 1: キーワード入力 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Step 1: 構成案を生成
                  {useEnhanced && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-purple-100 text-purple-700">
                      <Sparkles className="h-3 w-3 mr-1" />
                      SEO強化版
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyword">ターゲットキーワード</Label>
                  <Input
                    id="keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="例: パートナーマーケティング 成功事例"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isGeneratingOutline) {
                        generateOutline()
                      }
                    }}
                  />
                </div>

                {/* 強化版モード切替 */}
                <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useEnhanced"
                      checked={useEnhanced}
                      onChange={(e) => setUseEnhanced(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="useEnhanced" className="text-sm cursor-pointer">
                      成功パターンを学習して生成
                    </Label>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px]">
                        GSC/GA4データからS/Aランク記事の構成・文体を学習します
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <Button
                  onClick={generateOutline}
                  disabled={isGeneratingOutline || !keyword.trim()}
                  className="w-full"
                >
                  {isGeneratingOutline ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      構成案を生成
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 生成された構成 */}
            {generatedOutline && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      生成された構成案
                    </span>
                    <Button size="sm" variant="outline" onClick={applyOutlineToEditor}>
                      <Check className="mr-2 h-3 w-3" />
                      適用
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">タイトル</Label>
                    <p className="font-medium">{generatedOutline.title}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">説明</Label>
                    <p className="text-sm text-muted-foreground">
                      {generatedOutline.description}
                    </p>
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    {generatedOutline.outline.map((item, index) => {
                      const sectionKey = `section-${index}`
                      const content = getCurrentSectionContent(index)
                      const isCurrentlyWriting = isWritingSection && activeSection === sectionKey

                      return (
                        <AccordionItem key={index} value={sectionKey}>
                          <AccordionTrigger className="text-sm hover:no-underline">
                            <span
                              className={
                                item.level === 'h2' ? 'font-semibold' : 'pl-4 text-muted-foreground'
                              }
                            >
                              {item.level === 'h2' ? '■' : '└'} {item.text}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-2">
                              {item.keywords && item.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.keywords.map((kw, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {kw}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWriteSection(item.text, index)}
                                disabled={isCurrentlyWriting}
                              >
                                {isCurrentlyWriting ? (
                                  <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    執筆中...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="mr-2 h-3 w-3" />
                                    この章を書く
                                  </>
                                )}
                              </Button>

                              {/* 生成されたコンテンツ */}
                              {content && (
                                <div className="mt-3 space-y-2">
                                  <div className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                    {content}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const tag = item.level === 'h2' ? '##' : '###'
                                        onInsertContent(`${tag} ${item.text}\n\n${content}`)
                                      }}
                                    >
                                      <Check className="mr-2 h-3 w-3" />
                                      エディタに挿入
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(content, index)}
                                    >
                                      {copiedIndex === index ? (
                                        <Check className="mr-2 h-3 w-3" />
                                      ) : (
                                        <Copy className="mr-2 h-3 w-3" />
                                      )}
                                      コピー
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Step 2: 内部リンク提案 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Step 2: 内部リンクを提案
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  現在のコンテンツを分析し、関連記事へのリンクを提案します
                </p>
                <Button
                  onClick={suggestLinks}
                  disabled={isLoadingLinks || !currentContent.trim()}
                  variant="outline"
                  className="w-full"
                >
                  {isLoadingLinks ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      リンクを分析
                    </>
                  )}
                </Button>

                {linkSuggestions.length > 0 && (
                  <div className="space-y-3">
                    {linkSuggestions.map((link, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 space-y-2 text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-primary">{link.anchorText}</p>
                              {link.rank && (
                                <Badge
                                  variant={link.rank === 'S' ? 'default' : link.rank === 'A' ? 'secondary' : 'outline'}
                                  className={`text-xs ${link.rank === 'S' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                                >
                                  {link.rank}
                                  {link.seoScore && `: ${link.seoScore}`}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              → {link.articleTitle}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                `[${link.anchorText}](${link.url})`,
                                100 + index
                              )
                            }
                          >
                            {copiedIndex === 100 + index ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          💡 {link.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoadingLinks && linkSuggestions.length === 0 && currentContent.trim() && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    「リンクを分析」をクリックして内部リンクの提案を取得
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

