'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Monitor, 
  Smartphone, 
  RotateCcw,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Columns,
  Home,
  Building2,
  Newspaper,
  BookOpen,
  Calendar,
  Layers,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'

// 表示モード
type ViewMode = 'desktop' | 'mobile' | 'both'

// ページカテゴリ
type PageCategory = 'all' | 'list' | 'static' | 'lab' | 'lab_category' | 'lab_tag' | 'lab_content_type' | 'news' | 'seminar' | 'casestudy' | 'knowledge' | 'member'

// カテゴリ設定
const PAGE_CATEGORIES: { value: PageCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: '全て', icon: <Layers className="w-3.5 h-3.5" /> },
  { value: 'list', label: '一覧', icon: <Home className="w-3.5 h-3.5" /> },
  { value: 'static', label: '静的', icon: <Building2 className="w-3.5 h-3.5" /> },
  { value: 'lab', label: 'Lab記事', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { value: 'lab_category', label: 'Labカテゴリ', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { value: 'lab_tag', label: 'Labタグ', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { value: 'lab_content_type', label: 'Labタイプ', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { value: 'news', label: 'News', icon: <Newspaper className="w-3.5 h-3.5" /> },
  { value: 'seminar', label: 'セミナー', icon: <Calendar className="w-3.5 h-3.5" /> },
  { value: 'casestudy', label: '導入事例', icon: <Building2 className="w-3.5 h-3.5" /> },
  { value: 'knowledge', label: 'お役立ち資料', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { value: 'member', label: 'メンバー', icon: <Building2 className="w-3.5 h-3.5" /> },
]

// カテゴリごとの初期表示件数
const INITIAL_DISPLAY_COUNT = 6
const LOAD_MORE_COUNT = 6

// 固定の一覧ページ
const LIST_PAGES: { path: string; label: string; category: PageCategory }[] = [
  { path: '/', label: 'ホーム', category: 'list' },
  { path: '/lab', label: 'Lab一覧', category: 'list' },
  { path: '/lab/content_type/research', label: 'リサーチ一覧', category: 'list' },
  { path: '/lab/content_type/interview', label: 'インタビュー一覧', category: 'list' },
  { path: '/lab/content_type/knowledge', label: 'ナレッジ一覧(Lab)', category: 'list' },
  { path: '/news', label: 'News一覧', category: 'list' },
  { path: '/seminar', label: 'セミナー一覧', category: 'list' },
  { path: '/casestudy', label: '導入事例一覧', category: 'list' },
  { path: '/member', label: 'メンバー一覧', category: 'list' },
  { path: '/knowledge', label: 'お役立ち資料一覧', category: 'list' },
]

// 固定の静的ページ
const STATIC_PAGES: { path: string; label: string; category: PageCategory }[] = [
  { path: '/company', label: '会社概要', category: 'static' },
  { path: '/brandsite', label: 'ブランドサイト', category: 'static' },
  { path: '/recruitment', label: '採用情報', category: 'static' },
  { path: '/partner-marketing', label: 'パートナーマーケティング', category: 'static' },
  { path: '/privacy', label: 'プライバシーポリシー', category: 'static' },
  { path: '/terms', label: '利用規約', category: 'static' },
]

interface PageItem {
  path: string
  label: string
  category: PageCategory
}

interface PreviewFrameProps {
  path: string
  label: string
  width: number
  height?: number
  device: 'desktop' | 'mobile'
  baseUrl: string
}

function PreviewFrame({ 
  path, 
  label, 
  width, 
  height = 800, 
  device,
  baseUrl 
}: PreviewFrameProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const fullUrl = `${baseUrl}${path}`
  const displayLabel = `${label} (${device === 'mobile' ? 'Mobile' : 'Desktop'})`

  // Intersection Observerで遅延読み込み
  useEffect(() => {
    const element = frameRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true)
            setHasLoaded(true)
          }
        })
      },
      {
        rootMargin: '200px', // 200px手前から読み込み開始
        threshold: 0,
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [hasLoaded])

  return (
    <div 
      ref={frameRef}
      className="flex-shrink-0 flex flex-col"
      style={{ width: `${width}px` }}
    >
      {/* Frame Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-800 rounded-t-xl border-b border-neutral-700">
        <div className="flex items-center gap-3">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          
          {/* Device Icon & Label */}
          <div className="flex items-center gap-2 ml-2">
            {device === 'mobile' ? (
              <Smartphone className="w-4 h-4 text-neutral-400" />
            ) : (
              <Monitor className="w-4 h-4 text-neutral-400" />
            )}
            <span className="text-sm font-medium text-white truncate max-w-[200px]">{displayLabel}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Width Badge */}
          <span className="text-xs text-neutral-400 bg-neutral-700 px-2 py-1 rounded">
            {width}px
          </span>
          
          {/* Open in New Tab */}
          <a 
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
      
      {/* URL Bar */}
      <div className="px-4 py-2 bg-neutral-800/80 border-b border-neutral-700">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-700 rounded-md">
          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-neutral-300 truncate">{fullUrl}</span>
        </div>
      </div>
      
      {/* iframe Container */}
      <div 
        className="relative bg-white rounded-b-xl overflow-hidden shadow-2xl"
        style={{ height: `${height}px` }}
      >
        {!isVisible ? (
          // 遅延読み込み: まだ表示領域に入っていない
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <div className="flex flex-col items-center gap-3 text-neutral-400">
              <Monitor className="w-12 h-12" />
              <span className="text-sm">スクロールで読み込み</span>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-neutral-500">読み込み中...</span>
                </div>
              </div>
            )}
            <iframe
              src={fullUrl}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              title={displayLabel}
              loading="lazy"
            />
          </>
        )}
      </div>
    </div>
  )
}

// Zoom Presets
const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150]

// View Mode Options
const VIEW_MODE_OPTIONS: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  { value: 'desktop', label: 'Desktop', icon: <Monitor className="w-4 h-4" /> },
  { value: 'mobile', label: 'Mobile', icon: <Smartphone className="w-4 h-4" /> },
  { value: 'both', label: 'Both', icon: <Columns className="w-4 h-4" /> },
]

export default function CanvasPage() {
  const [zoom, setZoom] = useState(100)
  const [baseUrl, setBaseUrl] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [selectedCategory, setSelectedCategory] = useState<PageCategory>('list') // デフォルトを「一覧」に変更
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT) // 表示件数
  const [dynamicPages, setDynamicPages] = useState<{
    lab: PageItem[]
    labCategories: PageItem[]
    labTags: PageItem[]
    labContentTypes: PageItem[]
    news: PageItem[]
    seminar: PageItem[]
    casestudy: PageItem[]
    knowledge: PageItem[]
    member: PageItem[]
    static: PageItem[]
  }>({ lab: [], labCategories: [], labTags: [], labContentTypes: [], news: [], seminar: [], casestudy: [], knowledge: [], member: [], static: [] })
  const [isLoadingPages, setIsLoadingPages] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)
  const lastTouchDistance = useRef<number | null>(null)

  useEffect(() => {
    // クライアントサイドでbaseUrlを取得
    setBaseUrl(window.location.origin)
  }, [])

  // データベースからページ情報を取得
  const fetchDynamicPages = useCallback(async () => {
    setIsLoadingPages(true)
    try {
      const res = await fetch('/api/canvas/pages')
      if (res.ok) {
        const data = await res.json()
        setDynamicPages(data)
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error)
    } finally {
      setIsLoadingPages(false)
    }
  }, [])

  useEffect(() => {
    fetchDynamicPages()
  }, [fetchDynamicPages])

  // ピンチズーム用のズーム関数
  const adjustZoom = useCallback((delta: number) => {
    setZoom(prev => {
      const newZoom = prev + delta
      return Math.min(Math.max(newZoom, 10), 200)
    })
  }, [])

  // トラックパッド/マウスホイールでのズーム（Ctrl+ホイール or ピンチ）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      // Ctrl+ホイール または トラックパッドのピンチ
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = -e.deltaY * 0.5
        adjustZoom(delta)
      }
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [adjustZoom])

  // タッチデバイスでのピンチズーム
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const getTouchDistance = (touches: TouchList): number => {
      if (touches.length < 2) return 0
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchDistance.current = getTouchDistance(e.touches)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        e.preventDefault()
        const currentDistance = getTouchDistance(e.touches)
        const delta = (currentDistance - lastTouchDistance.current) * 0.2
        adjustZoom(delta)
        lastTouchDistance.current = currentDistance
      }
    }

    const handleTouchEnd = () => {
      lastTouchDistance.current = null
    }

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [adjustZoom])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 10))
  }

  const handleResetZoom = () => {
    setZoom(50)
  }

  // 全ページリストを構築
  const getAllPages = useCallback((): PageItem[] => {
    return [
      ...LIST_PAGES,
      ...STATIC_PAGES,
      ...dynamicPages.lab,
      ...dynamicPages.labCategories,
      ...dynamicPages.labTags,
      ...dynamicPages.labContentTypes,
      ...dynamicPages.news,
      ...dynamicPages.seminar,
      ...dynamicPages.casestudy,
      ...dynamicPages.knowledge,
      ...dynamicPages.member,
    ]
  }, [dynamicPages])

  // カテゴリでフィルタリングされたページを取得（表示件数制限なし）
  const getAllFilteredPages = useCallback((): PageItem[] => {
    const allPages = getAllPages()
    if (selectedCategory === 'all') {
      return allPages
    }
    return allPages.filter(page => page.category === selectedCategory)
  }, [selectedCategory, getAllPages])

  // カテゴリでフィルタリングされたページを取得（表示件数制限あり）
  const getFilteredPages = useCallback((): PageItem[] => {
    const filtered = getAllFilteredPages()
    return filtered.slice(0, displayCount)
  }, [getAllFilteredPages, displayCount])

  // カテゴリ変更時に表示件数をリセット
  const handleCategoryChange = useCallback((category: PageCategory) => {
    setSelectedCategory(category)
    setDisplayCount(INITIAL_DISPLAY_COUNT)
  }, [])

  // もっと見るボタン
  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + LOAD_MORE_COUNT)
  }, [])

  // 表示モードに応じてフレームを生成
  const getFrames = useCallback(() => {
    const filteredPages = getFilteredPages()
    const frames: { path: string; label: string; width: number; device: 'desktop' | 'mobile'; height: number }[] = []
    
    filteredPages.forEach(page => {
      if (viewMode === 'desktop' || viewMode === 'both') {
        frames.push({
          path: page.path,
          label: page.label,
          width: 1440,
          device: 'desktop',
          height: 900,
        })
      }
      if (viewMode === 'mobile' || viewMode === 'both') {
        frames.push({
          path: page.path,
          label: page.label,
          width: 375,
          device: 'mobile',
          height: 812,
        })
      }
    })
    
    return frames
  }, [viewMode, getFilteredPages])

  const frames = getFrames()
  const filteredPages = getFilteredPages()
  const allFilteredPages = getAllFilteredPages()
  const allPages = getAllPages()
  const hasMore = allFilteredPages.length > displayCount

  // 各カテゴリのページ数を取得
  const getCategoryCount = (category: PageCategory) => {
    if (category === 'all') return allPages.length
    return allPages.filter(p => p.category === category).length
  }

  if (!baseUrl) {
    return (
      <div className="h-full w-full bg-neutral-200 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-neutral-200 flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-300">
        {/* First Row: Title and View/Zoom Controls */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-gray-900">
              キャンバスモード
            </h1>
            <span className="text-sm text-gray-500">
              {filteredPages.length}{allFilteredPages.length > filteredPages.length ? `/${allFilteredPages.length}` : ''}ページ / {frames.length}フレーム
            </span>
            <button
              onClick={fetchDynamicPages}
              disabled={isLoadingPages}
              className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="ページリストを更新"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingPages ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Selector */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {VIEW_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setViewMode(option.value)}
                  className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === option.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={option.label}
                >
                  {option.icon}
                  <span className="hidden md:inline">{option.label}</span>
                </button>
              ))}
            </div>
            
            {/* Divider */}
            <div className="h-5 w-px bg-gray-300" />
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              {/* Zoom Presets - hide some on small screens */}
              <div className="hidden lg:flex items-center gap-0.5">
                {ZOOM_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setZoom(preset)}
                    className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                      zoom === preset
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
              
              {/* Zoom Buttons */}
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={handleZoomOut}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                  title="ズームアウト"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                
                <span className="px-2 text-xs font-medium text-gray-700 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                  title="ズームイン"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <button
                onClick={handleResetZoom}
                className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="ズームをリセット"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Second Row: Category Tabs */}
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {PAGE_CATEGORIES.map((category) => {
            const count = getCategoryCount(category.value)
            return (
              <button
                key={category.value}
                onClick={() => handleCategoryChange(category.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                  selectedCategory === category.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {category.icon}
                {category.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedCategory === category.value
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Canvas Area */}
      <div 
        ref={canvasRef}
        className="flex-1 overflow-auto touch-none"
      >
        <div 
          className="p-6 origin-top-left transition-transform duration-200"
          style={{ 
            transform: `scale(${zoom / 100})`,
            width: `${100 / (zoom / 100)}%`,
          }}
        >
          {isLoadingPages ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>ページ情報を読み込み中...</span>
              </div>
            </div>
          ) : frames.length > 0 ? (
            <div className="flex gap-6 items-start">
              {frames.map((frame, index) => (
                <PreviewFrame
                  key={`${frame.path}-${frame.device}-${index}`}
                  path={frame.path}
                  label={frame.label}
                  width={frame.width}
                  device={frame.device}
                  baseUrl={baseUrl}
                  height={frame.height}
                />
              ))}
              
              {/* もっと見るボタン */}
              {hasMore && (
                <div 
                  className="flex-shrink-0 flex flex-col items-center justify-center"
                  style={{ width: viewMode === 'mobile' ? '375px' : '400px', height: '400px' }}
                >
                  <button
                    onClick={handleLoadMore}
                    className="flex flex-col items-center gap-3 px-8 py-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
                  >
                    <ChevronDown className="w-8 h-8 text-indigo-600" />
                    <span className="text-lg font-medium text-gray-700">もっと見る</span>
                    <span className="text-sm text-gray-500">
                      残り{allFilteredPages.length - displayCount}ページ
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>このカテゴリにはページがありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
