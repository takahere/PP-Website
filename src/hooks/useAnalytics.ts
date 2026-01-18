import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// GA4 データ取得フック
export function useGAData(options?: { refreshInterval?: number }) {
  return useSWR('/api/analytics/ga', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000, // 5分間の重複排除
    ...options,
  })
}

// Google Search Console データ取得フック
export function useGSCData(options?: { refreshInterval?: number }) {
  return useSWR('/api/analytics/gsc', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10 * 60 * 1000, // 10分間の重複排除
    ...options,
  })
}

// ビジネスメトリクス取得フック
export function useBusinessMetrics() {
  return useSWR('/api/analytics/business', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000,
  })
}

// Labメトリクス取得フック
export function useLabMetrics() {
  return useSWR('/api/analytics/lab-metrics', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000,
  })
}

// キャンバスページデータ取得フック
export function useCanvasPages() {
  return useSWR('/api/canvas/pages', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60 * 1000, // 1分間の重複排除
  })
}

// 汎用的なアナリティクスデータ取得フック
export function useAnalyticsData<T>(endpoint: string, options?: { refreshInterval?: number }) {
  return useSWR<T>(`/api/analytics/${endpoint}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000,
    ...options,
  })
}
