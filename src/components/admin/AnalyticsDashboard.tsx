'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts'
import {
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  Target,
  BookOpen,
  Calendar,
  Building2,
  Zap,
  MousePointerClick,
  Share2,
  Globe,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Eye,
  Search,
  FileDown,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MapPin,
  LogOut,
  ExternalLink,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CohortAnalysisCard, AttributionChart, WebVitalsCard, ReaderHeatmapCard } from './analytics'

// 型定義
interface GAData {
  date: string
  users: number
  sessions: number
  pageviews: number
  bounceRate: number
  avgSessionDuration: number
  engagementRate: number
  avgEngagementTime: number
}

interface GASummary {
  totalUsers: number
  totalSessions: number
  totalPageviews: number
  avgBounceRate: number
  avgSessionDuration: number
  avgEngagementRate: number
  avgEngagementTime: number
  usersTrend: number
}

interface ChannelData {
  channel: string
  users: number
  sessions: number
  percentage: number
  [key: string]: string | number // Rechartsのデータ型に対応
}

interface PageEngagementData {
  pagePath: string
  pageTitle: string
  pageviews: number
  avgEngagementTime: number
  engagementRate: number
}

interface CategoryData {
  category: string
  pageviews: number
  users: number
  avgEngagementTime: number
  percentage: number
  [key: string]: string | number // Rechartsのデータ型に対応
}

interface GSCQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCSummary {
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  avgPosition: number
}

interface BusinessMetrics {
  newMembers: number
  newMembersTrend: number
  newArticles: number
  newArticlesTrend: number
  newSeminars: number
  newSeminarsTrend: number
  newCasestudies: number
  newCasestudiesTrend: number
  totalLabArticles: number
  totalPosts: number
  totalPages: number
  totalMembers: number
}

interface LabMetrics {
  currentMonth: {
    month: string
    users: number
    pageviews: number
    downloads: number
    formSubmissions: number
    cvr: number
  }
  previousMonths: Array<{
    month: string
    users: number
    pageviews: number
    downloads: number
    formSubmissions: number
    cvr: number
  }>
  summary: {
    totalUsers: number
    totalDownloads: number
    totalFormSubmissions: number
    avgCvr: number
  }
}

// 新KPI型定義
interface TransitionData {
  summary: {
    labSessions: number
    transitionSessions: number
    transitionRate: number
    trend: number
  }
  byDestination: Array<{
    destination: string
    destinationLabel: string
    sessions: number
    percentage: number
  }>
  bySourceArticle: Array<{
    articlePath: string
    articleTitle: string
    transitionSessions: number
    transitionRate: number
  }>
}

interface BottleneckArticle {
  path: string
  title: string
  metrics: {
    position: number
    impressions: number
    clicks: number
    ctr: number
    sessions: number
    downloads: number
    cvr: number
  }
  bottleneck: {
    type: 'ctr' | 'cvr' | 'impressions' | 'healthy'
    label: string
    priority: 'high' | 'medium' | 'low'
    suggestion: string
  }
}

interface BottleneckData {
  articles: BottleneckArticle[]
  summary: {
    totalArticles: number
    healthyCount: number
    ctrIssueCount: number
    cvrIssueCount: number
    impIssueCount: number
  }
}

interface NonBrandData {
  summary: {
    totalImpressions: number
    nonBrandImpressions: number
    nonBrandPercentage: number
    totalClicks: number
    nonBrandClicks: number
    nonBrandCtr: number
    brandImpressions: number
    brandClicks: number
  }
  topNonBrandQueries: Array<{
    query: string
    impressions: number
    clicks: number
    ctr: number
    position: number
  }>
}

// 地域データ型
interface GeoData {
  name: string
  users: number
  sessions: number
  pageviews: number
  percentage: number
}

interface GeoDataResponse {
  countries: GeoData[]
  regions: GeoData[]
  cities: GeoData[]
}

// ランディングページ型
interface LandingPageMetrics {
  page: string
  sessions: number
  users: number
  bounceRate: number
  avgSessionDuration: number
  conversionRate: number
}

interface LandingPageData {
  overview: {
    totalLandingPages: number
    totalSessions: number
    avgBounceRate: number
    avgConversionRate: number
  }
  topLandingPages: LandingPageMetrics[]
  insights: {
    bestPerformingLP: string
    highestBounceLPs: string[]
    underutilizedLPs: string[]
    opportunityLPs: string[]
  }
}

// 離脱ページ型
interface ExitPageMetrics {
  page: string
  exits: number
  exitRate: number
  pageviews: number
  avgTimeOnPage: number
  improvementPriority: 'high' | 'medium' | 'low'
}

interface ExitPageData {
  overview: {
    totalExits: number
    avgExitRate: number
  }
  topExitPages: ExitPageMetrics[]
  insights: {
    criticalExitPages: string[]
    improvementOpportunities: {
      page: string
      issue: string
      potentialGain: number
    }[]
  }
}

// サービスサイトCVR型
interface ServiceCVRData {
  summary: {
    serviceSiteSessions: number
    formSubmissions: number
    serviceCvr: number
    trend: number
    previousMonthCvr: number
  }
  byPage: Array<{
    page: string
    pageLabel: string
    sessions: number
    formSubmissions: number
    cvr: number
  }>
  byChannel: Array<{
    channel: string
    sessions: number
    formSubmissions: number
    cvr: number
  }>
  kpiBreakdown: {
    impressions: number
    ctr: number
    transitionRate: number
    serviceCvr: number
    estimatedCV: number
  }
}

// チャネル別Lab効果型
interface LabChannelEffectData {
  summary: {
    totalLabSessions: number
    totalTransitions: number
    avgTransitionRate: number
    bestChannel: string
    worstChannel: string
  }
  byChannel: Array<{
    channel: string
    labSessions: number
    transitionSessions: number
    transitionRate: number
    downloads: number
    downloadRate: number
    avgTimeOnLab: number
    bounceRate: number
  }>
  channelComparison: Array<{
    channel: string
    labShare: number
    transitionRate: number
    effectiveness: 'high' | 'medium' | 'low'
  }>
  insights: {
    recommendation: string
    underperformingChannels: string[]
    highPotentialChannels: string[]
  }
}

// チャート用の色
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

// 月フォーマット
function formatMonth(monthStr: string): string {
  if (!monthStr || monthStr.length !== 6) return monthStr
  return `${monthStr.slice(0, 4)}/${monthStr.slice(4)}`
}

// トレンドアイコン（モダン版）
function TrendIndicator({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-sm font-medium text-muted-foreground">±0{suffix}</span>
  
  const isPositive = value > 0
  const colorClass = isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-red-50'
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      colorClass
    )}>
      <Icon className="h-3 w-3" />
      {Math.abs(value)}{suffix}
    </span>
  )
}

// モダンなカードコンポーネント
function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  color = "indigo",
  subtitle,
  tooltip
}: {
  title: string
  value: string | number
  trend?: number
  icon: LucideIcon
  color?: "indigo" | "emerald" | "amber" | "rose" | "purple" | "blue" | "cyan"
  subtitle?: string
  tooltip?: string
}) {
  const colorStyles = {
    indigo: "from-indigo-500 to-purple-500 text-indigo-600 bg-indigo-50",
    emerald: "from-emerald-500 to-teal-500 text-emerald-600 bg-emerald-50",
    amber: "from-amber-500 to-orange-500 text-amber-600 bg-amber-50",
    rose: "from-rose-500 to-pink-500 text-rose-600 bg-rose-50",
    purple: "from-purple-500 to-fuchsia-500 text-purple-600 bg-purple-50",
    blue: "from-blue-500 to-indigo-500 text-blue-600 bg-blue-50",
    cyan: "from-cyan-500 to-sky-500 text-cyan-600 bg-cyan-50",
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg", colorStyles[color].split(' ')[2])}>
          <Icon className={cn("h-5 w-5", colorStyles[color].split(' ')[1])} />
        </div>
        {trend !== undefined && <TrendIndicator value={trend} />}
      </div>
      <div>
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {tooltip && (
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      </div>
    </div>
  )
}

export function AnalyticsDashboard({ headerActions }: { headerActions?: React.ReactNode }) {
  // State
  const [gaData, setGaData] = useState<GAData[]>([])
  const [gaSummary, setGaSummary] = useState<GASummary | null>(null)
  const [channels, setChannels] = useState<ChannelData[]>([])
  const [pageEngagement, setPageEngagement] = useState<PageEngagementData[]>([])
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [gscQueries, setGscQueries] = useState<GSCQuery[]>([])
  const [gscSummary, setGscSummary] = useState<GSCSummary | null>(null)
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null)
  const [labMetrics, setLabMetrics] = useState<LabMetrics | null>(null)
  // 新KPI State
  const [transitionData, setTransitionData] = useState<TransitionData | null>(null)
  const [bottleneckData, setBottleneckData] = useState<BottleneckData | null>(null)
  const [nonBrandData, setNonBrandData] = useState<NonBrandData | null>(null)
  // 追加分析State
  const [geoData, setGeoData] = useState<GeoDataResponse | null>(null)
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null)
  const [exitPageData, setExitPageData] = useState<ExitPageData | null>(null)
  // KPI完成に必要なState
  const [serviceCvrData, setServiceCvrData] = useState<ServiceCVRData | null>(null)
  const [labChannelData, setLabChannelData] = useState<LabChannelEffectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // データ取得
  const fetchData = useCallback(async (refresh = false) => {
    setLoading(true)
    setError(null)

    try {
      const refreshParam = refresh ? '?refresh=true' : ''
      const [gaRes, gscRes, businessRes, labRes, transitionRes, bottleneckRes, nonBrandRes, geoRes, landingRes, exitRes, serviceCvrRes, labChannelRes] = await Promise.all([
        fetch(`/api/analytics/ga${refreshParam}`),
        fetch(`/api/analytics/gsc${refreshParam}`),
        fetch('/api/analytics/business'),
        fetch(`/api/analytics/lab-metrics${refreshParam}`),
        fetch(`/api/analytics/lab-transition${refreshParam}`),
        fetch(`/api/analytics/lab-bottleneck${refreshParam}`),
        fetch(`/api/analytics/non-brand-search${refreshParam}`),
        fetch(`/api/analytics/geo${refreshParam}`),
        fetch(`/api/analytics/landing-pages${refreshParam}`),
        fetch(`/api/analytics/exit-pages${refreshParam}`),
        fetch(`/api/analytics/service-cvr${refreshParam}`),
        fetch(`/api/analytics/lab-channel-effect${refreshParam}`),
      ])

      const gaJson = await gaRes.json()
      const gscJson = await gscRes.json()
      const businessJson = await businessRes.json()
      const labJson = await labRes.json()
      const transitionJson = await transitionRes.json()
      const bottleneckJson = await bottleneckRes.json()
      const nonBrandJson = await nonBrandRes.json()
      const geoJson = await geoRes.json()
      const landingJson = await landingRes.json()
      const exitJson = await exitRes.json()
      const serviceCvrJson = await serviceCvrRes.json()
      const labChannelJson = await labChannelRes.json()

      setGaData(gaJson.data || [])
      setGaSummary(gaJson.summary || null)
      setChannels(gaJson.channels || [])
      setPageEngagement(gaJson.pageEngagement || [])
      setCategories(gaJson.categories || [])
      setGscQueries(gscJson.queries || [])
      setGscSummary(gscJson.summary || null)
      setBusinessMetrics(businessJson)
      setLabMetrics(labJson.data || null)
      // 新KPIデータ
      setTransitionData(transitionJson.data || null)
      setBottleneckData(bottleneckJson.data || null)
      setNonBrandData(nonBrandJson.data || null)
      // 追加分析データ
      setGeoData({ countries: geoJson.countries || [], regions: geoJson.regions || [], cities: geoJson.cities || [] })
      setLandingPageData(landingJson.data || null)
      setExitPageData(exitJson.data || null)
      // KPI完成に必要なデータ
      setServiceCvrData(serviceCvrJson.data || null)
      setLabChannelData(labChannelJson.data || null)

      setIsDemo(gaJson.demo || gscJson.demo || businessJson.demo || labJson.demo || transitionJson.demo || bottleneckJson.demo || nonBrandJson.demo || geoJson.demo || landingJson.demo || exitJson.demo || serviceCvrJson.demo || labChannelJson.demo || false)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // チャート用データ整形
  const chartData = gaData.map((d) => ({
    ...d,
    dateLabel: d.date.slice(5), // MM-DD
    engagementRatePercent: Math.round(d.engagementRate * 100),
  }))

  const labChartData = labMetrics ? [...labMetrics.previousMonths, labMetrics.currentMonth].map(d => ({
    ...d,
    monthLabel: formatMonth(d.month),
  })) : []

  // 改善チャンスクエリ（表示多い＆CTR低い）
  const improvementQueries = [...gscQueries]
    .filter(q => q.impressions > 50 && q.ctr < 0.05)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="lab">Lab分析</TabsTrigger>
            <TabsTrigger value="seo">SEO・集客</TabsTrigger>
            <TabsTrigger value="advanced">高度な分析</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            {headerActions}
            {isDemo && (
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1.5" />
                デモデータ
              </Badge>
            )}
            <Button
              size="sm"
              onClick={() => fetchData(true)}
              disabled={loading}
              className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm h-9"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              データ更新
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* ===== メイン統計 ===== */}
          {gaSummary && (
            <section>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-full lg:col-span-2 p-8 shadow-sm">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <p className="text-muted-foreground font-medium mb-1">総ユーザー数（過去30日）</p>
                        <h3 className="text-5xl font-bold tracking-tight text-gray-900">{gaSummary.totalUsers.toLocaleString()}</h3>
                      </div>
                      <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <Users className="h-7 w-7 text-indigo-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 w-fit px-3 py-1.5 rounded-full border border-indigo-100">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">前月比 +{gaSummary.usersTrend}%</span>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-6 grid-rows-2 col-span-full md:col-span-2 lg:col-span-2">
                  <MetricCard
                    title="ページビュー"
                    value={gaSummary.totalPageviews.toLocaleString()}
                    icon={Eye}
                    color="emerald"
                    subtitle="過去30日"
                    tooltip="閲覧されたページの総数。同じユーザーが複数ページを見た場合もカウントされます"
                  />
                  <MetricCard
                    title="エンゲージメント率"
                    value={`${gaSummary.avgEngagementRate}%`}
                    icon={Zap}
                    color="amber"
                    subtitle="意味のあるセッション"
                    tooltip="10秒以上滞在、または2ページ以上閲覧、またはCVしたセッションの割合"
                  />
                </div>
              </div>
            </section>
          )}

          {/* ===== セクション1: ビジネス成果 ===== */}
          <section className="space-y-6">
            <div className="pb-4 border-b border-gray-200/60">
              <h2 className="text-xl font-bold text-gray-900">ビジネス成果</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="新規Lab会員"
                value={businessMetrics?.newMembers ?? 0}
                trend={businessMetrics?.newMembersTrend ?? 0}
                icon={Users}
                color="indigo"
              />
              <MetricCard
                title="公開記事"
                value={businessMetrics?.newArticles ?? 0}
                trend={businessMetrics?.newArticlesTrend ?? 0}
                icon={BookOpen}
                color="emerald"
              />
              <MetricCard
                title="セミナー"
                value={businessMetrics?.newSeminars ?? 0}
                trend={businessMetrics?.newSeminarsTrend ?? 0}
                icon={Calendar}
                color="amber"
              />
              <MetricCard
                title="導入事例"
                value={businessMetrics?.newCasestudies ?? 0}
                trend={businessMetrics?.newCasestudiesTrend ?? 0}
                icon={Building2}
                color="purple"
              />
            </div>
          </section>

          {/* ===== セクション2: トラフィック分析 ===== */}
          <section className="space-y-6">
            <div className="pb-4 border-b border-gray-200/60">
              <h2 className="text-xl font-bold text-gray-900">トラフィック推移</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* メインチャート */}
              <Card className="lg:col-span-2 border-none shadow-md overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                  <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                    ユーザー数の推移
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                          dataKey="dateLabel" 
                          stroke="#94a3b8"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#94a3b8"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            padding: '12px',
                          }}
                          itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                          cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stroke="#6366f1" 
                          strokeWidth={3}
                          fill="url(#colorUsers)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* チャネル別シェア */}
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                  <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-emerald-500" />
                    流入チャネル
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[220px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channels}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="users"
                          cornerRadius={6}
                        >
                          {channels.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              strokeWidth={0}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 space-y-3">
                    {channels.slice(0, 4).map((channel, index) => (
                      <div key={channel.channel} className="flex items-center justify-between text-sm group">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
                            {channel.channel}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">{channel.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ===== セクション3: 地域別分析 ===== */}
          {geoData && geoData.regions.length > 0 && (
            <section className="space-y-6">
              <div className="pb-4 border-b border-gray-200/60">
                <h2 className="text-xl font-bold text-gray-900">地域別分析</h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* 都道府県別 */}
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                    <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-rose-500" />
                      都道府県別ユーザー数
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={geoData.regions.slice(0, 8)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            width={80}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                          <Bar dataKey="users" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 地域サマリー */}
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                    <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      地域分布
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {geoData.regions.slice(0, 6).map((region, index) => (
                        <div key={region.name} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
                              style={{ backgroundColor: COLORS[index % COLORS.length] + '20', color: COLORS[index % COLORS.length] }}>
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900">{region.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="block font-bold text-gray-900">{region.users.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">{region.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="lab" className="space-y-6">
          {labMetrics && (
            <>
              {/* Labサマリー */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Labユーザー総数"
                  value={labMetrics.summary.totalUsers.toLocaleString()}
                  icon={Users}
                  color="indigo"
                  subtitle="過去6ヶ月"
                  tooltip="過去6ヶ月間に/lab/ページを訪問したユニークユーザー数"
                />
                <MetricCard
                  title="資料ダウンロード"
                  value={labMetrics.summary.totalDownloads.toLocaleString()}
                  icon={FileDown}
                  color="emerald"
                  subtitle="Lab経由"
                  tooltip="Lab記事をランディングページとしたセッションからの「資料ダウンロード」イベント数"
                />
                <MetricCard
                  title="CVR (DL率)"
                  value={`${labMetrics.summary.avgCvr}%`}
                  icon={Target}
                  color="amber"
                  tooltip="ダウンロード数 ÷ ユーザー数 × 100。Lab訪問者のうち資料をDLした割合"
                />
                <MetricCard
                  title="問い合わせ数"
                  value={labMetrics.summary.totalFormSubmissions.toLocaleString()}
                  icon={MessageSquare}
                  color="purple"
                  subtitle="Lab経由"
                  tooltip="Lab取材フォーム（/lab/inquiry/）からの送信数"
                />
              </div>

              {/* Transition Rate */}
              {transitionData && (
                <section className="space-y-4">
                  <div className="pb-4 border-b border-gray-200/60">
                    <h2 className="text-xl font-bold text-gray-900">Transition Rate（送客力）</h2>
                  </div>
                  <div className="grid gap-6 md:grid-cols-3">
                    <MetricCard
                      title="Lab → サービスサイト遷移率"
                      value={`${transitionData.summary.transitionRate}%`}
                      trend={transitionData.summary.trend}
                      icon={ArrowRight}
                      color="cyan"
                      tooltip="Lab記事からサービスサイト・導入事例・セミナー・お役立ち資料へ遷移したセッションの割合"
                    />
                    <MetricCard
                      title="Labセッション数"
                      value={transitionData.summary.labSessions.toLocaleString()}
                      icon={Eye}
                      color="indigo"
                      subtitle="過去30日"
                      tooltip="Lab記事をランディングページとしたセッション数"
                    />
                    <MetricCard
                      title="遷移セッション数"
                      value={transitionData.summary.transitionSessions.toLocaleString()}
                      icon={Share2}
                      color="emerald"
                      subtitle="サービスサイトへ"
                      tooltip="Lab記事から他サービスページへ遷移した数"
                    />
                  </div>
                  {/* 遷移先別 */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-none shadow-md overflow-hidden">
                      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                        <CardTitle className="text-base font-medium text-gray-700">遷移先別内訳</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                          {transitionData.byDestination.map((dest) => (
                            <div key={dest.destination} className="flex items-center justify-between p-4">
                              <span className="font-medium text-gray-900">{dest.destinationLabel}</span>
                              <div className="text-right">
                                <span className="block font-bold text-gray-900">{dest.sessions}</span>
                                <span className="text-xs text-muted-foreground">{dest.percentage}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-md overflow-hidden">
                      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                        <CardTitle className="text-base font-medium text-gray-700">遷移元記事 Top 5</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                          {transitionData.bySourceArticle.slice(0, 5).map((article) => (
                            <div key={article.articlePath} className="flex items-center justify-between p-4">
                              <span className="font-medium text-gray-900 truncate max-w-[200px]" title={article.articlePath}>{article.articleTitle}</span>
                              <div className="text-right">
                                <span className="block font-bold text-gray-900">{article.transitionSessions}</span>
                                <span className="text-xs text-cyan-600">{article.transitionRate}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              )}

              {/* ボトルネック診断 */}
              {bottleneckData && (
                <section className="space-y-4">
                  <div className="pb-4 border-b border-gray-200/60">
                    <h2 className="text-xl font-bold text-gray-900">記事別ボトルネック診断</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border bg-emerald-50 p-4">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">良好</span>
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-emerald-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">パフォーマンスが良好な記事。引き続き質を維持しましょう</p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-3xl font-bold text-emerald-800 mt-2">{bottleneckData.summary.healthyCount}</p>
                    </div>
                    <div className="rounded-xl border bg-amber-50 p-4">
                      <div className="flex items-center gap-2 text-amber-700">
                        <MousePointerClick className="h-5 w-5" />
                        <span className="font-medium">タイトル改善</span>
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-amber-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">順位10位以内だがCTR3%未満。検索上位なのにクリックされていない。タイトル・説明文の改善が必要</p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-3xl font-bold text-amber-800 mt-2">{bottleneckData.summary.ctrIssueCount}</p>
                    </div>
                    <div className="rounded-xl border bg-purple-50 p-4">
                      <div className="flex items-center gap-2 text-purple-700">
                        <Target className="h-5 w-5" />
                        <span className="font-medium">導線改善</span>
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-purple-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">月間100セッション以上だがCVR1%未満。訪問はあるがCVしていない。CTA配置の見直しが必要</p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-3xl font-bold text-purple-800 mt-2">{bottleneckData.summary.cvrIssueCount}</p>
                    </div>
                    <div className="rounded-xl border bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">コンテンツ改善</span>
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">検索順位が20位以下。検索結果に表示されていない。記事のリライトや被リンク獲得が必要</p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{bottleneckData.summary.impIssueCount}</p>
                    </div>
                  </div>
                  <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                      <CardTitle className="text-base font-medium text-gray-700">改善が必要な記事</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-gray-100">
                        {bottleneckData.articles.filter(a => a.bottleneck.type !== 'healthy').slice(0, 10).map((article) => (
                          <div key={article.path} className="flex items-center justify-between p-4 hover:bg-gray-50/50">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0",
                                  article.bottleneck.priority === 'high' && "border-rose-200 bg-rose-50 text-rose-700",
                                  article.bottleneck.priority === 'medium' && "border-amber-200 bg-amber-50 text-amber-700",
                                  article.bottleneck.priority === 'low' && "border-gray-200 bg-gray-50 text-gray-700"
                                )}
                              >
                                {article.bottleneck.label}
                              </Badge>
                              <span className="font-medium text-gray-900 truncate" title={article.path}>{article.path}</span>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <div className="text-xs text-muted-foreground">
                                順位 {article.metrics.position} | CTR {article.metrics.ctr}% | CVR {article.metrics.cvr}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Labチャート */}
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                  <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                    Lab成長推移 (ユーザー数 vs ダウンロード数)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={labChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="monthLabel" scale="point" padding={{ left: 10, right: 10 }} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="users"
                          name="ユーザー数"
                          fill="#6366f1"
                          barSize={20}
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="downloads"
                          name="ダウンロード数"
                          stroke="#10b981"
                          strokeWidth={3}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* サービスサイトCVR */}
              {serviceCvrData && (
                <section className="space-y-4">
                  <div className="pb-4 border-b border-gray-200/60">
                    <h2 className="text-xl font-bold text-gray-900">サービスサイトCVR（KPI公式完成）</h2>
                  </div>
                  <div className="grid gap-6 md:grid-cols-4">
                    <MetricCard
                      title="サービスサイトCVR"
                      value={`${serviceCvrData.summary.serviceCvr}%`}
                      trend={serviceCvrData.summary.trend}
                      icon={Target}
                      color="rose"
                      tooltip="フォーム送信数 ÷ サービスサイトセッション数 × 100"
                    />
                    <MetricCard
                      title="サービスサイトセッション"
                      value={serviceCvrData.summary.serviceSiteSessions.toLocaleString()}
                      icon={Eye}
                      color="indigo"
                      subtitle="過去30日"
                    />
                    <MetricCard
                      title="フォーム送信数"
                      value={serviceCvrData.summary.formSubmissions.toLocaleString()}
                      icon={MessageSquare}
                      color="emerald"
                      subtitle="CV数"
                    />
                    <MetricCard
                      title="推定CV（KPI公式）"
                      value={serviceCvrData.kpiBreakdown.estimatedCV}
                      icon={Sparkles}
                      color="purple"
                      tooltip="imp × CTR × Transition × CVRによる推定"
                    />
                  </div>

                  {/* KPI公式の可視化 */}
                  <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                      <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        KPI分解: CV = imp × CTR × Transition × CVR
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="text-center p-4 bg-blue-50 rounded-xl flex-1 min-w-[120px]">
                          <p className="text-sm text-blue-600 font-medium">Impressions</p>
                          <p className="text-2xl font-bold text-blue-700">{serviceCvrData.kpiBreakdown.impressions.toLocaleString()}</p>
                        </div>
                        <span className="text-2xl font-bold text-gray-400">×</span>
                        <div className="text-center p-4 bg-emerald-50 rounded-xl flex-1 min-w-[120px]">
                          <p className="text-sm text-emerald-600 font-medium">CTR</p>
                          <p className="text-2xl font-bold text-emerald-700">{serviceCvrData.kpiBreakdown.ctr}%</p>
                        </div>
                        <span className="text-2xl font-bold text-gray-400">×</span>
                        <div className="text-center p-4 bg-amber-50 rounded-xl flex-1 min-w-[120px]">
                          <p className="text-sm text-amber-600 font-medium">Transition</p>
                          <p className="text-2xl font-bold text-amber-700">{serviceCvrData.kpiBreakdown.transitionRate}%</p>
                        </div>
                        <span className="text-2xl font-bold text-gray-400">×</span>
                        <div className="text-center p-4 bg-rose-50 rounded-xl flex-1 min-w-[120px]">
                          <p className="text-sm text-rose-600 font-medium">CVR</p>
                          <p className="text-2xl font-bold text-rose-700">{serviceCvrData.kpiBreakdown.serviceCvr}%</p>
                        </div>
                        <span className="text-2xl font-bold text-gray-400">=</span>
                        <div className="text-center p-4 bg-purple-50 rounded-xl flex-1 min-w-[120px]">
                          <p className="text-sm text-purple-600 font-medium">推定CV</p>
                          <p className="text-2xl font-bold text-purple-700">{serviceCvrData.kpiBreakdown.estimatedCV}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ページ別CVR */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-none shadow-md overflow-hidden">
                      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                        <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                          <Target className="h-4 w-4 text-rose-500" />
                          ページ別CVR
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                          {serviceCvrData.byPage.slice(0, 6).map((page) => (
                            <div key={page.page} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-gray-900">{page.pageLabel}</span>
                                <span className="text-xs text-muted-foreground block truncate">{page.page}</span>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <span className="block font-bold text-gray-900">{page.cvr}%</span>
                                <span className="text-xs text-muted-foreground">{page.formSubmissions} / {page.sessions}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md overflow-hidden">
                      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                        <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                          <Share2 className="h-4 w-4 text-indigo-500" />
                          チャネル別CVR
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                          {serviceCvrData.byChannel.slice(0, 6).map((ch) => (
                            <div key={ch.channel} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                              <span className="font-medium text-gray-900">{ch.channel}</span>
                              <div className="text-right">
                                <span className="block font-bold text-gray-900">{ch.cvr}%</span>
                                <span className="text-xs text-muted-foreground">{ch.formSubmissions} / {ch.sessions}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              )}

              {/* チャネル別Lab効果 */}
              {labChannelData && (
                <section className="space-y-4">
                  <div className="pb-4 border-b border-gray-200/60">
                    <h2 className="text-xl font-bold text-gray-900">チャネル別Lab効果</h2>
                  </div>
                  <div className="grid gap-6 md:grid-cols-4">
                    <MetricCard
                      title="平均遷移率"
                      value={`${labChannelData.summary.avgTransitionRate}%`}
                      icon={ArrowRight}
                      color="cyan"
                      tooltip="全チャネル平均のLab→サービスサイト遷移率"
                    />
                    <MetricCard
                      title="総Labセッション"
                      value={labChannelData.summary.totalLabSessions.toLocaleString()}
                      icon={Users}
                      color="indigo"
                      subtitle="過去30日"
                    />
                    <MetricCard
                      title="ベストチャネル"
                      value={labChannelData.summary.bestChannel}
                      icon={CheckCircle2}
                      color="emerald"
                      tooltip="最も遷移率が高いチャネル"
                    />
                    <MetricCard
                      title="改善優先チャネル"
                      value={labChannelData.summary.worstChannel}
                      icon={AlertCircle}
                      color="rose"
                      tooltip="最も遷移率が低いチャネル"
                    />
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* チャネル比較チャート */}
                    <Card className="border-none shadow-md overflow-hidden">
                      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                        <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                          <Share2 className="h-4 w-4 text-cyan-500" />
                          チャネル別遷移率
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="h-[280px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={labChannelData.byChannel.slice(0, 6)} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                              <XAxis type="number" tick={{ fontSize: 12 }} unit="%" />
                              <YAxis
                                type="category"
                                dataKey="channel"
                                tick={{ fontSize: 11 }}
                                width={100}
                              />
                              <Tooltip
                                formatter={(value) => [`${value}%`, '遷移率']}
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: 'none',
                                  borderRadius: '12px',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                }}
                              />
                              <Bar dataKey="transitionRate" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* チャネル効果一覧 */}
                    <Card className="border-none shadow-md overflow-hidden">
                      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                        <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500" />
                          チャネル効果一覧
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                          {labChannelData.channelComparison.map((ch) => (
                            <div key={ch.channel} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "shrink-0",
                                    ch.effectiveness === 'high' && "border-emerald-200 bg-emerald-50 text-emerald-700",
                                    ch.effectiveness === 'medium' && "border-amber-200 bg-amber-50 text-amber-700",
                                    ch.effectiveness === 'low' && "border-rose-200 bg-rose-50 text-rose-700"
                                  )}
                                >
                                  {ch.effectiveness === 'high' ? '高効果' : ch.effectiveness === 'medium' ? '標準' : '要改善'}
                                </Badge>
                                <span className="font-medium text-gray-900 truncate">{ch.channel}</span>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <span className="block font-bold text-gray-900">{ch.transitionRate}%</span>
                                <span className="text-xs text-muted-foreground">シェア {ch.labShare}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* インサイト */}
                  {labChannelData.insights.recommendation && (
                    <Card className="border-none shadow-md overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-indigo-100">
                            <Sparkles className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">改善提案</h4>
                            <p className="text-gray-700">{labChannelData.insights.recommendation}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </section>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          {/* 非指名検索サマリー */}
          {nonBrandData && (
            <section className="space-y-4">
              <div className="pb-4 border-b border-gray-200/60">
                <h2 className="text-xl font-bold text-gray-900">非指名検索流入</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-4">
                <MetricCard
                  title="非指名検索の割合"
                  value={`${nonBrandData.summary.nonBrandPercentage}%`}
                  icon={Globe}
                  color="blue"
                  subtitle="総impに対して"
                  tooltip="ブランド名（partnerprop, パートナープロップ等）を含まない検索クエリからの流入割合"
                />
                <MetricCard
                  title="非指名クリック数"
                  value={nonBrandData.summary.nonBrandClicks.toLocaleString()}
                  icon={MousePointerClick}
                  color="emerald"
                  subtitle="過去28日"
                  tooltip="非指名キーワードからの検索流入クリック数"
                />
                <MetricCard
                  title="非指名CTR"
                  value={`${nonBrandData.summary.nonBrandCtr}%`}
                  icon={Target}
                  color="amber"
                  tooltip="非指名検索のクリック数 ÷ 表示回数 × 100"
                />
                <MetricCard
                  title="ブランドクリック数"
                  value={nonBrandData.summary.brandClicks.toLocaleString()}
                  icon={Building2}
                  color="purple"
                  subtitle="指名検索"
                  tooltip="ブランド名を含む検索クエリからのクリック数"
                />
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
              {/* 人気キーワード */}
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                  <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-500" />
                    人気キーワード Top 5
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {gscQueries.slice(0, 5).map((query, index) => (
                      <div key={query.query} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-900">{query.query}</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-gray-900">{query.clicks} clicks</span>
                          <span className="text-xs text-muted-foreground">CTR {query.ctr}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 改善のチャンス */}
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                  <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    改善のチャンス (高表示・低CTR)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {improvementQueries.map((query) => (
                      <div key={query.query} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                            <TrendingUp className="h-3 w-3" />
                          </div>
                          <div>
                            <span className="block font-medium text-gray-900">{query.query}</span>
                            <span className="text-xs text-muted-foreground">現在 {query.position}位</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-gray-900">{query.impressions} imp</span>
                          <span className="text-xs text-amber-600 font-medium">CTR {query.ctr}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

          {/* 非指名キーワードTop */}
          {nonBrandData && (
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                  <Search className="h-4 w-4 text-emerald-500" />
                  非指名キーワード Top 10
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {nonBrandData.topNonBrandQueries.slice(0, 10).map((query, index) => (
                    <div key={query.query} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">{query.query}</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-gray-900">{query.clicks} clicks</span>
                        <span className="text-xs text-muted-foreground">{query.impressions} imp | 順位 {query.position}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== ランディングページ分析 ===== */}
          {landingPageData && (
            <section className="space-y-4">
              <div className="pb-4 border-b border-gray-200/60">
                <h2 className="text-xl font-bold text-gray-900">ランディングページ分析</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-4">
                <MetricCard
                  title="ランディングページ数"
                  value={landingPageData.overview.totalLandingPages}
                  icon={ExternalLink}
                  color="blue"
                  tooltip="流入があったランディングページの総数"
                />
                <MetricCard
                  title="総セッション数"
                  value={landingPageData.overview.totalSessions.toLocaleString()}
                  icon={Users}
                  color="emerald"
                  subtitle="過去30日"
                />
                <MetricCard
                  title="平均直帰率"
                  value={`${landingPageData.overview.avgBounceRate}%`}
                  icon={LogOut}
                  color="amber"
                  tooltip="ランディングページからそのまま離脱した割合"
                />
                <MetricCard
                  title="平均CVR"
                  value={`${landingPageData.overview.avgConversionRate}%`}
                  icon={Target}
                  color="purple"
                  tooltip="ランディングページからのコンバージョン率"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* トップランディングページ */}
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                    <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-blue-500" />
                      トップLP（セッション順）
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {landingPageData.topLandingPages.slice(0, 8).map((lp, index) => (
                        <div key={lp.page} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 shrink-0">
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900 truncate" title={lp.page}>{lp.page}</span>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className="block font-bold text-gray-900">{lp.sessions.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">直帰 {lp.bounceRate}% | CVR {lp.conversionRate}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* LPインサイト */}
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                    <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      LPインサイト
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {landingPageData.insights.bestPerformingLP && (
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                        <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-1">
                          <CheckCircle2 className="h-4 w-4" />
                          最高パフォーマンスLP
                        </div>
                        <p className="text-gray-900 font-medium truncate">{landingPageData.insights.bestPerformingLP}</p>
                      </div>
                    )}
                    {landingPageData.insights.underutilizedLPs.length > 0 && (
                      <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                        <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-2">
                          <AlertCircle className="h-4 w-4" />
                          改善の余地あり（高流入・低CVR）
                        </div>
                        <div className="space-y-1">
                          {landingPageData.insights.underutilizedLPs.slice(0, 3).map((page) => (
                            <p key={page} className="text-gray-700 text-sm truncate">{page}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {landingPageData.insights.opportunityLPs.length > 0 && (
                      <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                        <div className="flex items-center gap-2 text-purple-700 text-sm font-medium mb-2">
                          <TrendingUp className="h-4 w-4" />
                          成長機会（高CVR・低流入）
                        </div>
                        <div className="space-y-1">
                          {landingPageData.insights.opportunityLPs.slice(0, 3).map((page) => (
                            <p key={page} className="text-gray-700 text-sm truncate">{page}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {/* ===== 離脱ページ分析 ===== */}
          {exitPageData && (
            <section className="space-y-4">
              <div className="pb-4 border-b border-gray-200/60">
                <h2 className="text-xl font-bold text-gray-900">離脱ページ分析</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <MetricCard
                  title="総離脱数"
                  value={exitPageData.overview.totalExits.toLocaleString()}
                  icon={LogOut}
                  color="rose"
                  subtitle="過去30日"
                  tooltip="全ページからの離脱の合計数"
                />
                <MetricCard
                  title="平均離脱率"
                  value={`${exitPageData.overview.avgExitRate}%`}
                  icon={XCircle}
                  color="amber"
                  tooltip="各ページビュー後に離脱する確率の平均"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* 高優先度離脱ページ */}
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                    <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                      <LogOut className="h-4 w-4 text-rose-500" />
                      離脱が多いページ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {exitPageData.topExitPages.slice(0, 8).map((page) => (
                        <div key={page.page} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0",
                                page.improvementPriority === 'high' && "border-rose-200 bg-rose-50 text-rose-700",
                                page.improvementPriority === 'medium' && "border-amber-200 bg-amber-50 text-amber-700",
                                page.improvementPriority === 'low' && "border-gray-200 bg-gray-50 text-gray-700"
                              )}
                            >
                              {page.improvementPriority === 'high' ? '高' : page.improvementPriority === 'medium' ? '中' : '低'}
                            </Badge>
                            <span className="font-medium text-gray-900 truncate" title={page.page}>{page.page}</span>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className="block font-bold text-gray-900">{page.exits.toLocaleString()}</span>
                            <span className="text-xs text-rose-600 font-medium">離脱率 {page.exitRate}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 改善機会 */}
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                    <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-500" />
                      改善機会
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {exitPageData.insights.improvementOpportunities.map((opp) => (
                      <div key={opp.page} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 truncate flex-1" title={opp.page}>{opp.page}</span>
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 shrink-0 ml-2">
                            +{opp.potentialGain} CV
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{opp.issue}</p>
                      </div>
                    ))}
                    {exitPageData.insights.criticalExitPages.length > 0 && (
                      <div className="p-4 rounded-lg bg-rose-50 border border-rose-100">
                        <div className="flex items-center gap-2 text-rose-700 text-sm font-medium mb-2">
                          <AlertCircle className="h-4 w-4" />
                          CVファネル上の離脱ポイント
                        </div>
                        <div className="space-y-1">
                          {exitPageData.insights.criticalExitPages.slice(0, 3).map((page) => (
                            <p key={page} className="text-gray-700 text-sm truncate">{page}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          )}
        </TabsContent>

        {/* ===== Tab 4: 高度な分析 ===== */}
        <TabsContent value="advanced" className="space-y-6">
          {activeTab === 'advanced' && (
            <>
              {/* 読者行動ヒートマップ */}
              <ReaderHeatmapCard />

              {/* コホート分析 */}
              <CohortAnalysisCard />

              {/* アトリビューション分析 */}
              <AttributionChart />

              {/* Web Vitals */}
              <WebVitalsCard />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
