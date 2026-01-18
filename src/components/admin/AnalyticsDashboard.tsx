'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
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
  TrendingDown,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
  Target,
  BookOpen,
  Calendar,
  Building2,
  Activity,
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
  FileText,
  FileDown,
  MessageSquare,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

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

// チャート用の色
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

// 時間フォーマット
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
}

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
  subtitle
}: {
  title: string
  value: string | number
  trend?: number
  icon: any
  color?: "indigo" | "emerald" | "amber" | "rose" | "purple" | "blue" | "cyan"
  subtitle?: string
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
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
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
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // データ取得
  const fetchData = useCallback(async (refresh = false) => {
    setLoading(true)
    setError(null)

    try {
      const refreshParam = refresh ? '?refresh=true' : ''
      const [gaRes, gscRes, businessRes, labRes] = await Promise.all([
        fetch(`/api/analytics/ga${refreshParam}`),
        fetch(`/api/analytics/gsc${refreshParam}`),
        fetch('/api/analytics/business'),
        fetch(`/api/analytics/lab-metrics${refreshParam}`),
      ])

      const gaJson = await gaRes.json()
      const gscJson = await gscRes.json()
      const businessJson = await businessRes.json()
      const labJson = await labRes.json()

      setGaData(gaJson.data || [])
      setGaSummary(gaJson.summary || null)
      setChannels(gaJson.channels || [])
      setPageEngagement(gaJson.pageEngagement || [])
      setCategories(gaJson.categories || [])
      setGscQueries(gscJson.queries || [])
      setGscSummary(gscJson.summary || null)
      setBusinessMetrics(businessJson)
      setLabMetrics(labJson.data || null)
      
      setIsDemo(gaJson.demo || gscJson.demo || businessJson.demo || labJson.demo || false)
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

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="lab">Lab分析</TabsTrigger>
            <TabsTrigger value="seo">SEO・集客</TabsTrigger>
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
                  />
                  <MetricCard
                    title="エンゲージメント率"
                    value={`${gaSummary.avgEngagementRate}%`}
                    icon={Zap}
                    color="amber"
                    subtitle="意味のあるセッション"
                  />
                </div>
              </div>
            </section>
          )}

          {/* ===== セクション1: ビジネス成果 ===== */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200/60">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Target className="h-5 w-5" />
              </div>
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
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200/60">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Activity className="h-5 w-5" />
              </div>
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
                />
                <MetricCard
                  title="資料ダウンロード"
                  value={labMetrics.summary.totalDownloads.toLocaleString()}
                  icon={FileDown}
                  color="emerald"
                  subtitle="Lab経由"
                />
                <MetricCard
                  title="CVR (DL率)"
                  value={`${labMetrics.summary.avgCvr}%`}
                  icon={Target}
                  color="amber"
                />
                <MetricCard
                  title="問い合わせ数"
                  value={labMetrics.summary.totalFormSubmissions.toLocaleString()}
                  icon={MessageSquare}
                  color="purple"
                  subtitle="Lab経由"
                />
              </div>

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
            </>
          )}
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
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
                    {improvementQueries.map((query, index) => (
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
