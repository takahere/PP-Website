import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { createClient } from '@supabase/supabase-js'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
const cachedData: Map<string, { data: ReaderHeatmapResult; timestamp: number }> = new Map()
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface ScrollFunnelPoint {
  depth: number
  users: number
  percentage: number
}

interface DropOffPoint {
  depth: number
  dropRate: number
  estimatedSection: string
  severity: 'high' | 'medium' | 'low'
}

interface SectionEngagement {
  section: string
  depth: number
  avgTimeEstimate: number
  scrollThroughRate: number
}

interface ReaderHeatmapResult {
  pagePath: string
  pageTitle: string
  totalUsers: number
  scrollFunnel: ScrollFunnelPoint[]
  dropOffPoints: DropOffPoint[]
  engagementBySections: SectionEngagement[]
  avgReadTime: number
  completionRate: number
  insights: {
    quality: 'excellent' | 'good' | 'needs_improvement' | 'poor'
    mainDropOffArea: string
    suggestions: string[]
  }
}

// Supabaseクライアント
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pagePath = searchParams.get('page')
    const forceRefresh = searchParams.get('refresh') === 'true'

    if (!pagePath) {
      return NextResponse.json(
        { error: 'page parameter is required' },
        { status: 400 }
      )
    }

    // キャッシュチェック
    const cacheKey = `heatmap-${pagePath}`
    if (!forceRefresh) {
      const cached = cachedData.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return NextResponse.json({ data: cached.data, cached: true })
      }
    }

    // GA設定チェック
    if (!isGoogleConfigured()) {
      return NextResponse.json({
        error: 'Google Analytics is not configured',
        demo: true,
        data: generateDemoData(pagePath),
      })
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID
    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    // 過去30日のデータ
    const startDate = '30daysAgo'
    const endDate = 'today'

    // 1. ページの基本メトリクス
    const pageMetricsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'EXACT',
            value: pagePath,
          },
        },
      },
      metrics: [
        { name: 'activeUsers' },
        { name: 'userEngagementDuration' },
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' },
      ],
    })

    const pageRow = pageMetricsResponse[0].rows?.[0]
    const totalUsers = Number(pageRow?.metricValues?.[0]?.value) || 0
    const totalEngagementDuration = Number(pageRow?.metricValues?.[1]?.value) || 0
    const engagementRate = Number(pageRow?.metricValues?.[2]?.value) || 0
    const avgReadTime = totalUsers > 0 ? Math.round(totalEngagementDuration / totalUsers) : 0

    // 2. スクロールイベントデータを取得
    // GA4のscrollイベントは90%到達をデフォルトで追跡
    const scrollEventsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'pagePath',
                stringFilter: {
                  matchType: 'EXACT',
                  value: pagePath,
                },
              },
            },
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'scroll',
                },
              },
            },
          ],
        },
      },
      metrics: [{ name: 'eventCount' }],
    })

    const scrollCount = Number(scrollEventsResponse[0].rows?.[0]?.metricValues?.[0]?.value) || 0
    const scrollRate = totalUsers > 0 ? scrollCount / totalUsers : 0

    // 3. スクロールファネルを推定（GA4の標準データから推定）
    // エンゲージメント率とスクロールイベントから各深度を推定
    const scrollFunnel = estimateScrollFunnel(totalUsers, engagementRate, scrollRate)

    // 4. 離脱ポイントを特定
    const dropOffPoints = identifyDropOffPoints(scrollFunnel)

    // 5. 記事の見出し構造を取得（Supabaseから）
    const supabase = getSupabaseClient()
    let pageTitle = pagePath
    let sections: { heading: string; depth: number }[] = []

    if (supabase) {
      // Lab記事の場合
      if (pagePath.startsWith('/lab/')) {
        const slug = pagePath.replace('/lab/', '').replace('/', '')
        const { data: article } = await supabase
          .from('lab_articles')
          .select('title, content_html')
          .eq('slug', slug)
          .single()

        if (article) {
          pageTitle = article.title
          sections = extractHeadings(article.content_html || '')
        }
      }
    }

    // 6. セクション別エンゲージメントを推定
    const engagementBySections = estimateSectionEngagement(sections, scrollFunnel, avgReadTime)

    // 7. 完了率（90%以上到達）
    const completionRate = scrollFunnel.find(p => p.depth === 90)?.percentage || 0

    // 8. インサイトを生成
    const insights = generateInsights(scrollFunnel, dropOffPoints, completionRate, avgReadTime)

    const result: ReaderHeatmapResult = {
      pagePath,
      pageTitle,
      totalUsers,
      scrollFunnel,
      dropOffPoints,
      engagementBySections,
      avgReadTime,
      completionRate,
      insights,
    }

    // キャッシュ更新
    cachedData.set(cacheKey, { data: result, timestamp: Date.now() })

    return NextResponse.json({ data: result, cached: false })
  } catch (error) {
    console.error('Reader Heatmap API Error:', error)
    const pagePath = new URL(request.url).searchParams.get('page') || '/unknown'
    return NextResponse.json({
      error: 'Failed to fetch reader heatmap data',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      data: generateDemoData(pagePath),
    })
  }
}

// スクロールファネルを推定
function estimateScrollFunnel(
  totalUsers: number,
  engagementRate: number,
  scrollRate: number
): ScrollFunnelPoint[] {
  // エンゲージメント率とスクロール率から各深度を推定
  // 一般的な離脱パターンを適用
  const baseDecay = 0.85 // 各10%で15%離脱
  const engagedBonus = engagementRate * 0.1 // エンゲージメント率が高いと離脱が減る

  const funnel: ScrollFunnelPoint[] = []
  let currentUsers = totalUsers

  for (let depth = 0; depth <= 100; depth += 10) {
    if (depth === 0) {
      funnel.push({ depth, users: totalUsers, percentage: 100 })
    } else {
      // 離脱率は深度が深くなるほど高くなる
      const depthFactor = 1 - (depth / 100) * 0.3
      const decayRate = baseDecay * depthFactor + engagedBonus
      currentUsers = Math.round(currentUsers * decayRate)

      // 90%到達は実測のスクロール率で調整
      if (depth === 90) {
        currentUsers = Math.round(totalUsers * scrollRate * 1.1) // スクロールイベントは90%到達
      }

      funnel.push({
        depth,
        users: currentUsers,
        percentage: totalUsers > 0 ? Math.round((currentUsers / totalUsers) * 100) : 0,
      })
    }
  }

  return funnel
}

// 離脱ポイントを特定
function identifyDropOffPoints(funnel: ScrollFunnelPoint[]): DropOffPoint[] {
  const dropOffPoints: DropOffPoint[] = []

  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1]
    const current = funnel[i]
    const dropRate = prev.percentage - current.percentage

    // 10%以上の離脱があるポイントを特定
    if (dropRate >= 10) {
      dropOffPoints.push({
        depth: current.depth,
        dropRate,
        estimatedSection: getSectionEstimate(current.depth),
        severity: dropRate >= 20 ? 'high' : dropRate >= 15 ? 'medium' : 'low',
      })
    }
  }

  return dropOffPoints.sort((a, b) => b.dropRate - a.dropRate)
}

// 深度からセクションを推定
function getSectionEstimate(depth: number): string {
  if (depth <= 20) return '導入部分'
  if (depth <= 40) return '本文前半'
  if (depth <= 60) return '本文中盤'
  if (depth <= 80) return '本文後半'
  return '結論部分'
}

// HTMLから見出しを抽出
function extractHeadings(html: string): { heading: string; depth: number }[] {
  const headings: { heading: string; depth: number }[] = []
  const regex = /<h([2-3])[^>]*>(.*?)<\/h\1>/gi
  let match
  const totalLength = html.replace(/<[^>]+>/g, '').length

  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '').trim()
    const positionBefore = html.substring(0, match.index).replace(/<[^>]+>/g, '').length
    const depth = Math.round((positionBefore / totalLength) * 100)

    headings.push({ heading: text, depth })
  }

  return headings
}

// セクション別エンゲージメントを推定
function estimateSectionEngagement(
  sections: { heading: string; depth: number }[],
  scrollFunnel: ScrollFunnelPoint[],
  avgReadTime: number
): SectionEngagement[] {
  if (sections.length === 0) {
    // 見出しがない場合はデフォルトセクションを生成
    return [
      { section: '導入', depth: 10, avgTimeEstimate: Math.round(avgReadTime * 0.15), scrollThroughRate: 90 },
      { section: '本文', depth: 50, avgTimeEstimate: Math.round(avgReadTime * 0.6), scrollThroughRate: 60 },
      { section: '結論', depth: 90, avgTimeEstimate: Math.round(avgReadTime * 0.25), scrollThroughRate: 25 },
    ]
  }

  return sections.map((s, i) => {
    const nextDepth = i < sections.length - 1 ? sections[i + 1].depth : 100
    const sectionLength = nextDepth - s.depth
    const scrollThroughRate = scrollFunnel.find(f => f.depth >= s.depth)?.percentage || 0

    return {
      section: s.heading,
      depth: s.depth,
      avgTimeEstimate: Math.round((sectionLength / 100) * avgReadTime),
      scrollThroughRate,
    }
  })
}

// インサイトを生成
function generateInsights(
  scrollFunnel: ScrollFunnelPoint[],
  dropOffPoints: DropOffPoint[],
  completionRate: number,
  avgReadTime: number
): ReaderHeatmapResult['insights'] {
  // 品質評価
  let quality: ReaderHeatmapResult['insights']['quality'] = 'good'
  if (completionRate >= 30 && avgReadTime >= 180) quality = 'excellent'
  else if (completionRate >= 20 && avgReadTime >= 120) quality = 'good'
  else if (completionRate >= 10 && avgReadTime >= 60) quality = 'needs_improvement'
  else quality = 'poor'

  // 主要離脱エリア
  const mainDropOff = dropOffPoints[0]
  const mainDropOffArea = mainDropOff
    ? `${mainDropOff.depth}%付近（${mainDropOff.estimatedSection}）`
    : '特定の離脱ポイントなし'

  // 改善提案
  const suggestions: string[] = []

  if (completionRate < 20) {
    suggestions.push('記事が長すぎる可能性があります。重要ポイントを前半に移動することを検討してください')
  }

  if (avgReadTime < 60) {
    suggestions.push('読者の滞在時間が短いです。導入部分をより魅力的にしましょう')
  }

  const earlyDropOff = dropOffPoints.find(d => d.depth <= 30 && d.dropRate >= 15)
  if (earlyDropOff) {
    suggestions.push('記事の最初の部分で多くの読者が離脱しています。導入部分を改善してください')
  }

  const midDropOff = dropOffPoints.find(d => d.depth > 30 && d.depth <= 70 && d.dropRate >= 15)
  if (midDropOff) {
    suggestions.push('本文中盤で離脱が発生しています。視覚的要素（画像・図表）の追加を検討してください')
  }

  if (scrollFunnel.find(f => f.depth === 50)?.percentage || 0 < 50) {
    suggestions.push('半分以上の読者が50%到達前に離脱しています。小見出しで区切りを明確にしましょう')
  }

  if (suggestions.length === 0) {
    suggestions.push('読者エンゲージメントは良好です。このコンテンツパターンを他の記事でも活用してください')
  }

  return { quality, mainDropOffArea, suggestions }
}

// デモデータ生成
function generateDemoData(pagePath: string): ReaderHeatmapResult {
  return {
    pagePath,
    pageTitle: 'パートナーマーケティング完全ガイド',
    totalUsers: 1250,
    scrollFunnel: [
      { depth: 0, users: 1250, percentage: 100 },
      { depth: 10, users: 1188, percentage: 95 },
      { depth: 20, users: 1100, percentage: 88 },
      { depth: 30, users: 988, percentage: 79 },
      { depth: 40, users: 850, percentage: 68 },
      { depth: 50, users: 725, percentage: 58 },
      { depth: 60, users: 588, percentage: 47 },
      { depth: 70, users: 463, percentage: 37 },
      { depth: 80, users: 350, percentage: 28 },
      { depth: 90, users: 275, percentage: 22 },
      { depth: 100, users: 225, percentage: 18 },
    ],
    dropOffPoints: [
      {
        depth: 30,
        dropRate: 11,
        estimatedSection: '本文前半',
        severity: 'medium',
      },
      {
        depth: 60,
        dropRate: 11,
        estimatedSection: '本文中盤',
        severity: 'medium',
      },
    ],
    engagementBySections: [
      {
        section: 'パートナーマーケティングとは',
        depth: 10,
        avgTimeEstimate: 25,
        scrollThroughRate: 95,
      },
      {
        section: '成功するパートナープログラムの条件',
        depth: 25,
        avgTimeEstimate: 45,
        scrollThroughRate: 82,
      },
      {
        section: '具体的な施策と実践手順',
        depth: 45,
        avgTimeEstimate: 65,
        scrollThroughRate: 62,
      },
      {
        section: '導入事例と成果',
        depth: 70,
        avgTimeEstimate: 40,
        scrollThroughRate: 37,
      },
      {
        section: 'まとめと次のステップ',
        depth: 90,
        avgTimeEstimate: 20,
        scrollThroughRate: 22,
      },
    ],
    avgReadTime: 195,
    completionRate: 22,
    insights: {
      quality: 'good',
      mainDropOffArea: '30%付近（本文前半）',
      suggestions: [
        '本文前半で離脱が発生しています。具体例やビジュアルを追加して読者の関心を維持しましょう',
        '半分以上の読者が50%到達前に離脱しています。小見出しで区切りを明確にしましょう',
      ],
    },
  }
}
