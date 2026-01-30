/**
 * 異常検知閾値の型定義
 */

export type MetricType =
  | 'sessions'
  | 'users'
  | 'pageviews'
  | 'bounceRate'
  | 'conversions'
  | 'lcp'
  | 'fid'
  | 'cls'
  | 'fcp'
  | 'ttfb'

export interface AlertThreshold {
  id: string
  metric: MetricType
  warningMultiplier: number // デフォルト: 2 (2σ)
  criticalMultiplier: number // デフォルト: 3 (3σ)
  percentChangeThreshold: number // デフォルト: 30 (±30%)
  enabled: boolean
  updatedAt: string
  updatedBy: string | null
}

export interface AlertThresholdInput {
  metric: MetricType
  warningMultiplier?: number
  criticalMultiplier?: number
  percentChangeThreshold?: number
  enabled?: boolean
}

export interface AlertThresholdUpdate {
  warningMultiplier?: number
  criticalMultiplier?: number
  percentChangeThreshold?: number
  enabled?: boolean
}

export const DEFAULT_THRESHOLDS: Record<MetricType, Omit<AlertThreshold, 'id' | 'updatedAt' | 'updatedBy'>> = {
  sessions: {
    metric: 'sessions',
    warningMultiplier: 2,
    criticalMultiplier: 3,
    percentChangeThreshold: 30,
    enabled: true,
  },
  users: {
    metric: 'users',
    warningMultiplier: 2,
    criticalMultiplier: 3,
    percentChangeThreshold: 30,
    enabled: true,
  },
  pageviews: {
    metric: 'pageviews',
    warningMultiplier: 2,
    criticalMultiplier: 3,
    percentChangeThreshold: 30,
    enabled: true,
  },
  bounceRate: {
    metric: 'bounceRate',
    warningMultiplier: 2,
    criticalMultiplier: 3,
    percentChangeThreshold: 20, // 直帰率は変動が小さいので閾値も小さく
    enabled: true,
  },
  conversions: {
    metric: 'conversions',
    warningMultiplier: 2,
    criticalMultiplier: 3,
    percentChangeThreshold: 40, // CVは変動が大きいので閾値も大きく
    enabled: true,
  },
  lcp: {
    metric: 'lcp',
    warningMultiplier: 1.5,
    criticalMultiplier: 2,
    percentChangeThreshold: 25,
    enabled: true,
  },
  fid: {
    metric: 'fid',
    warningMultiplier: 1.5,
    criticalMultiplier: 2,
    percentChangeThreshold: 25,
    enabled: true,
  },
  cls: {
    metric: 'cls',
    warningMultiplier: 1.5,
    criticalMultiplier: 2,
    percentChangeThreshold: 25,
    enabled: true,
  },
  fcp: {
    metric: 'fcp',
    warningMultiplier: 1.5,
    criticalMultiplier: 2,
    percentChangeThreshold: 25,
    enabled: true,
  },
  ttfb: {
    metric: 'ttfb',
    warningMultiplier: 1.5,
    criticalMultiplier: 2,
    percentChangeThreshold: 25,
    enabled: true,
  },
}

export const METRIC_LABELS: Record<MetricType, string> = {
  sessions: 'セッション数',
  users: 'ユーザー数',
  pageviews: 'ページビュー',
  bounceRate: '直帰率',
  conversions: 'コンバージョン',
  lcp: 'LCP (Largest Contentful Paint)',
  fid: 'FID (First Input Delay)',
  cls: 'CLS (Cumulative Layout Shift)',
  fcp: 'FCP (First Contentful Paint)',
  ttfb: 'TTFB (Time to First Byte)',
}

export const METRIC_CATEGORIES: Record<string, MetricType[]> = {
  トラフィック: ['sessions', 'users', 'pageviews'],
  エンゲージメント: ['bounceRate', 'conversions'],
  'Core Web Vitals': ['lcp', 'fid', 'cls', 'fcp', 'ttfb'],
}
