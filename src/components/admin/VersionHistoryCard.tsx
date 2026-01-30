'use client'

import { useState, useCallback, useEffect } from 'react'
import { History, Loader2, RotateCcw, Eye, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Version {
  id: string
  title: string
  created_at: string
  created_by?: string
}

interface VersionDetail {
  id: string
  title: string
  content_html?: string
  thumbnail?: string | null
  seo_description?: string | null
  og_description?: string | null
  created_at: string
}

interface VersionHistoryCardProps {
  contentType: 'post' | 'page' | 'lab' | 'lab_article'
  contentSlug: string
  onRestore?: (data: {
    title: string
    content_html?: string
    thumbnail?: string | null
    seo_description?: string | null
    og_description?: string | null
  }) => void
}

// contentType を正規化（lab -> lab_article）
function normalizeContentType(type: 'post' | 'page' | 'lab' | 'lab_article'): 'post' | 'page' | 'lab_article' {
  return type === 'lab' ? 'lab_article' : type
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'たった今'
  if (diffInMinutes < 60) return `${diffInMinutes}分前`
  if (diffInHours < 24) return `${diffInHours}時間前`
  if (diffInDays < 7) return `${diffInDays}日前`
  return formatDate(dateString)
}

export function VersionHistoryCard({
  contentType,
  contentSlug,
  onRestore,
}: VersionHistoryCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  // プレビューダイアログ
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewVersion, setPreviewVersion] = useState<VersionDetail | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  // リストア確認ダイアログ
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [restoringVersion, setRestoringVersion] = useState<VersionDetail | null>(null)

  const fetchVersions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const normalizedType = normalizeContentType(contentType)

    try {
      const response = await fetch(
        `/api/versions?content_type=${normalizedType}&content_slug=${encodeURIComponent(contentSlug)}&limit=10`
      )

      const data = await response.json()

      if (data.error && !data.versions) {
        setError(data.error)
      } else {
        setVersions(data.versions || [])
      }
    } catch (err) {
      setError('履歴の取得に失敗しました')
      console.error('Version fetch error:', err)
    } finally {
      setIsLoading(false)
      setHasLoaded(true)
    }
  }, [contentType, contentSlug])

  const fetchVersionDetail = useCallback(async (versionId: string): Promise<VersionDetail | null> => {
    try {
      const response = await fetch(`/api/versions/${versionId}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return null
      }

      return data.version
    } catch (err) {
      setError('バージョン詳細の取得に失敗しました')
      console.error('Version detail fetch error:', err)
      return null
    }
  }, [])

  const handlePreview = async (version: Version) => {
    setIsLoadingPreview(true)
    setPreviewOpen(true)

    const detail = await fetchVersionDetail(version.id)
    setPreviewVersion(detail)
    setIsLoadingPreview(false)
  }

  const handleRestore = async (version: Version) => {
    setIsLoadingPreview(true)

    const detail = await fetchVersionDetail(version.id)
    if (detail) {
      setRestoringVersion(detail)
      setRestoreDialogOpen(true)
    }
    setIsLoadingPreview(false)
  }

  const confirmRestore = () => {
    if (!restoringVersion || !onRestore) return

    onRestore({
      title: restoringVersion.title,
      content_html: restoringVersion.content_html,
      thumbnail: restoringVersion.thumbnail,
      seo_description: restoringVersion.seo_description,
      og_description: restoringVersion.og_description,
    })

    setRestoreDialogOpen(false)
    setRestoringVersion(null)
  }

  // 初回ロード時に履歴を取得
  useEffect(() => {
    if (!hasLoaded) {
      fetchVersions()
    }
  }, [fetchVersions, hasLoaded])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            バージョン履歴
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchVersions}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && !hasLoaded ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {error}
            </p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              履歴がありません
            </p>
          ) : (
            <div className="space-y-2">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between rounded-lg border p-2 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={version.title}>
                      {index === 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-2">
                          最新
                        </span>
                      )}
                      {version.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(version.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(version)}
                      className="h-7 w-7 p-0"
                      title="プレビュー"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {index > 0 && onRestore && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(version)}
                        className="h-7 w-7 p-0"
                        title="復元"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* プレビューダイアログ */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>バージョンプレビュー</DialogTitle>
            <DialogDescription>
              {previewVersion && formatDate(previewVersion.created_at)}
            </DialogDescription>
          </DialogHeader>
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : previewVersion ? (
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    タイトル
                  </p>
                  <p className="text-lg font-bold">{previewVersion.title}</p>
                </div>
                {previewVersion.thumbnail && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      サムネイル
                    </p>
                    <p className="text-sm break-all">{previewVersion.thumbnail}</p>
                  </div>
                )}
                {previewVersion.seo_description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      SEO説明文
                    </p>
                    <p className="text-sm">{previewVersion.seo_description}</p>
                  </div>
                )}
                {previewVersion.content_html && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      本文（HTML）
                    </p>
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                        {previewVersion.content_html.substring(0, 2000)}
                        {previewVersion.content_html.length > 2000 && '...'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              読み込みに失敗しました
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* リストア確認ダイアログ */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>このバージョンを復元しますか？</DialogTitle>
            <DialogDescription>
              「{restoringVersion?.title}」の内容でフォームを上書きします。
              復元後、保存ボタンを押すまで変更は保存されません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="button" onClick={confirmRestore}>
              <RotateCcw className="mr-2 h-4 w-4" />
              復元する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
