'use client'

import { useState, useCallback, useEffect } from 'react'
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
}

interface AIWriterPanelProps {
  onInsertContent: (content: string) => void
  onApplyOutline: (outline: GeneratedOutline) => void
  currentContent?: string
}

export function AIWriterPanel({
  onInsertContent,
  onApplyOutline,
  currentContent = '',
}: AIWriterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [keyword, setKeyword] = useState('')

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

  // セクション執筆用のuseCompletion
  const {
    completion: sectionContent,
    isLoading: isWritingSection,
    complete: writeSection,
  } = useCompletion({
    api: '/api/ai-writer/section',
    onFinish: (prompt, completion) => {
      if (activeSection) {
        setGeneratedSections((prev) => ({
          ...prev,
          [activeSection]: completion,
        }))
      }
    },
  })

  // 構成案を生成
  const generateOutline = useCallback(async () => {
    if (!keyword.trim()) return

    setIsGeneratingOutline(true)
    setGeneratedOutline(null)
    setGeneratedSections({})

    try {
      const response = await fetch('/api/ai-writer/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
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
    } catch (error) {
      console.error('Outline generation failed:', error)
    } finally {
      setIsGeneratingOutline(false)
    }
  }, [keyword])

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
        },
      })
    },
    [writeSection, generatedOutline, currentContent]
  )

  // 内部リンクを提案
  const suggestLinks = useCallback(async () => {
    if (!currentContent.trim()) return

    setIsLoadingLinks(true)
    setLinkSuggestions([])

    try {
      const response = await fetch('/api/ai-writer/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentContent }),
      })

      const data = await response.json()
      setLinkSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Link suggestion failed:', error)
    } finally {
      setIsLoadingLinks(false)
    }
  }, [currentContent])

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
            {/* Step 1: キーワード入力 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Step 1: 構成案を生成
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
                            <p className="font-medium text-primary">{link.anchorText}</p>
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

