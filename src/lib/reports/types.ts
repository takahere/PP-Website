/**
 * カスタムレポートの型定義
 */

export type MetricSource = 'ga4' | 'gsc' | 'business' | 'lab'
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count'
export type GroupByPeriod = 'day' | 'week' | 'month'
export type DateRangeType = 'fixed' | 'relative'
export type ExportFormat = 'json' | 'csv' | 'pdf'

export interface ReportMetric {
  id: string
  source: MetricSource
  metric: string
  label: string
  aggregation: AggregationType
  enabled: boolean
}

export interface ReportDateRange {
  type: DateRangeType
  startDate?: string // fixed の場合
  endDate?: string // fixed の場合
  relativeDays?: number // relative の場合（例: 30 = 過去30日）
}

export interface ReportFilter {
  field: string
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between'
  value: string | number
  value2?: string | number // between の場合
}

export interface ReportConfig {
  metrics: ReportMetric[]
  dateRange: ReportDateRange
  groupBy: GroupByPeriod
  filters: ReportFilter[]
  includeCharts: boolean
  includeSummary: boolean
}

export interface ReportTemplate {
  id: string
  name: string
  description?: string
  config: ReportConfig
  createdBy: string
  createdAt: string
  updatedAt: string
  isPublic: boolean
}

export interface ReportTemplateInput {
  name: string
  description?: string
  config: ReportConfig
  isPublic?: boolean
}

export interface GeneratedReportData {
  [key: string]: string | number | null
}

export interface GeneratedReport {
  templateId: string
  templateName: string
  generatedAt: string
  period: {
    start: string
    end: string
  }
  groupBy: GroupByPeriod
  data: GeneratedReportData[]
  summary: Record<string, number>
  metadata: {
    totalRows: number
    metrics: string[]
    filters: ReportFilter[]
  }
}

// プリセットメトリクス
export const AVAILABLE_METRICS: Record<MetricSource, ReportMetric[]> = {
  ga4: [
    { id: 'ga4_sessions', source: 'ga4', metric: 'sessions', label: 'セッション数', aggregation: 'sum', enabled: true },
    { id: 'ga4_users', source: 'ga4', metric: 'activeUsers', label: 'ユーザー数', aggregation: 'sum', enabled: true },
    { id: 'ga4_pageviews', source: 'ga4', metric: 'screenPageViews', label: 'ページビュー', aggregation: 'sum', enabled: true },
    { id: 'ga4_bounceRate', source: 'ga4', metric: 'bounceRate', label: '直帰率', aggregation: 'avg', enabled: true },
    { id: 'ga4_avgSessionDuration', source: 'ga4', metric: 'avgSessionDuration', label: '平均セッション時間', aggregation: 'avg', enabled: true },
    { id: 'ga4_engagementRate', source: 'ga4', metric: 'engagementRate', label: 'エンゲージメント率', aggregation: 'avg', enabled: true },
    { id: 'ga4_conversions', source: 'ga4', metric: 'conversions', label: 'コンバージョン', aggregation: 'sum', enabled: true },
  ],
  gsc: [
    { id: 'gsc_impressions', source: 'gsc', metric: 'impressions', label: '表示回数', aggregation: 'sum', enabled: true },
    { id: 'gsc_clicks', source: 'gsc', metric: 'clicks', label: 'クリック数', aggregation: 'sum', enabled: true },
    { id: 'gsc_ctr', source: 'gsc', metric: 'ctr', label: 'CTR', aggregation: 'avg', enabled: true },
    { id: 'gsc_position', source: 'gsc', metric: 'position', label: '平均順位', aggregation: 'avg', enabled: true },
  ],
  business: [
    { id: 'biz_newMembers', source: 'business', metric: 'newMembers', label: '新規会員数', aggregation: 'sum', enabled: true },
    { id: 'biz_formSubmissions', source: 'business', metric: 'formSubmissions', label: 'フォーム送信数', aggregation: 'sum', enabled: true },
    { id: 'biz_downloads', source: 'business', metric: 'downloads', label: 'ダウンロード数', aggregation: 'sum', enabled: true },
  ],
  lab: [
    { id: 'lab_articleViews', source: 'lab', metric: 'articleViews', label: 'Lab記事閲覧数', aggregation: 'sum', enabled: true },
    { id: 'lab_transitionRate', source: 'lab', metric: 'transitionRate', label: 'Lab→サイト遷移率', aggregation: 'avg', enabled: true },
    { id: 'lab_uniqueReaders', source: 'lab', metric: 'uniqueReaders', label: 'Lab読者数', aggregation: 'sum', enabled: true },
  ],
}

// プリセット期間
export const PRESET_DATE_RANGES = [
  { label: '過去7日', value: 7 },
  { label: '過去14日', value: 14 },
  { label: '過去30日', value: 30 },
  { label: '過去90日', value: 90 },
  { label: '今月', value: 'currentMonth' },
  { label: '先月', value: 'lastMonth' },
  { label: '今四半期', value: 'currentQuarter' },
]

// デフォルトテンプレート
export const DEFAULT_TEMPLATES: Omit<ReportTemplate, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '週次トラフィックレポート',
    description: '過去7日間のトラフィック概要',
    isPublic: true,
    config: {
      metrics: [
        AVAILABLE_METRICS.ga4[0], // sessions
        AVAILABLE_METRICS.ga4[1], // users
        AVAILABLE_METRICS.ga4[2], // pageviews
        AVAILABLE_METRICS.ga4[3], // bounceRate
      ],
      dateRange: { type: 'relative', relativeDays: 7 },
      groupBy: 'day',
      filters: [],
      includeCharts: true,
      includeSummary: true,
    },
  },
  {
    name: '月次SEOレポート',
    description: '過去30日間の検索パフォーマンス',
    isPublic: true,
    config: {
      metrics: [
        AVAILABLE_METRICS.gsc[0], // impressions
        AVAILABLE_METRICS.gsc[1], // clicks
        AVAILABLE_METRICS.gsc[2], // ctr
        AVAILABLE_METRICS.gsc[3], // position
      ],
      dateRange: { type: 'relative', relativeDays: 30 },
      groupBy: 'week',
      filters: [],
      includeCharts: true,
      includeSummary: true,
    },
  },
]
