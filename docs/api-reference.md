# Analytics API Reference

PartnerProp Website の Analytics API 仕様書。

## 共通仕様

### 認証
- すべてのAPIは認証不要（内部利用）
- Cron APIは `Authorization: Bearer {CRON_SECRET}` ヘッダーが必要

### レスポンス形式
```json
{
  "data": { ... },
  "cached": true,
  "demo": false
}
```

- `cached`: キャッシュからの応答の場合 `true`
- `demo`: デモデータ（GA4未設定時）の場合 `true`

### エラーレスポンス
```json
{
  "error": "エラーメッセージ",
  "message": "詳細",
  "demo": true,
  "data": { ... }
}
```

---

## エンドポイント一覧

| Path | Method | Description | キャッシュ |
|------|--------|-------------|----------|
| `/api/analytics/ga` | GET | GA4コアメトリクス | 5分 |
| `/api/analytics/gsc` | GET | GSCデータ | 10分 |
| `/api/analytics/cohorts` | GET | コホート分析 | 10分 |
| `/api/analytics/attribution` | GET | アトリビューション | 10分 |
| `/api/analytics/anomalies` | GET | 異常検知 | 5分 |
| `/api/analytics/web-vitals` | GET | Core Web Vitals | 10分 |
| `/api/analytics/lab-metrics` | GET | Lab専用KPI | 5分 |
| `/api/analytics/hubspot-forms` | GET | HubSpotフォーム | 10分 |

---

## コホート分析 API

`GET /api/analytics/cohorts`

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| refresh | boolean | false | キャッシュを無視 |
| weeks | number | 8 | 分析対象週数（4-12） |

### レスポンス

```json
{
  "data": {
    "period": {
      "startDate": "2024-11-01",
      "endDate": "2025-01-29",
      "weeksAnalyzed": 8
    },
    "cohorts": [
      {
        "cohort": "2025-W04",
        "cohortLabel": "1月第4週",
        "initialUsers": 1200,
        "retention": {
          "week1": 45.2,
          "week2": 29.5,
          "week4": 19.8,
          "week8": null
        },
        "acquisitionChannel": "Organic Search",
        "conversionRate": 5.8,
        "avgSessionsPerUser": 1.65
      }
    ],
    "byChannel": [
      {
        "channel": "Organic Search",
        "cohorts": [...],
        "avgRetention": {
          "week1": 48.5,
          "week2": 31.2,
          "week4": 20.5
        }
      }
    ],
    "insights": {
      "bestRetentionCohort": "2025-W03",
      "worstRetentionCohort": "2024-W50",
      "avgWeek1Retention": 45.4,
      "avgWeek4Retention": 18.5,
      "retentionTrend": "improving",
      "bestChannel": "Organic Search"
    },
    "recommendations": [
      "Organic Searchチャネルのリテンションが最も高いです..."
    ]
  }
}
```

---

## アトリビューション分析 API

`GET /api/analytics/attribution`

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| refresh | boolean | false | キャッシュを無視 |
| model | string | last_touch | アトリビューションモデル |
| period | string | 30days | 分析期間 |

### アトリビューションモデル

| モデル | 説明 |
|--------|------|
| `last_touch` | コンバージョン直前のタッチポイントに100%付与 |
| `first_touch` | 最初のタッチポイントに100%付与 |
| `linear` | すべてのタッチポイントに均等配分 |
| `time_decay` | コンバージョンに近いほど高い重み（7日半減期） |

### レスポンス

```json
{
  "data": {
    "period": {
      "startDate": "30daysAgo",
      "endDate": "today"
    },
    "model": "linear",
    "modelDescription": "すべてのタッチポイントに均等に貢献度を配分",
    "channels": [
      {
        "channel": "Organic Search",
        "conversions": 45,
        "attributedValue": 48.5,
        "percentage": 53.3,
        "sessions": 3500,
        "avgPosition": 1
      }
    ],
    "paths": [
      {
        "path": ["Organic Search", "Lab"],
        "conversions": 18,
        "avgTouchpoints": 2.3,
        "totalValue": 18
      }
    ],
    "comparison": [
      {
        "channel": "Organic Search",
        "lastTouch": 45,
        "firstTouch": 52,
        "linear": 48.5,
        "timeDecay": 47.1
      }
    ],
    "summary": {
      "totalConversions": 114,
      "totalChannels": 6,
      "avgTouchpoints": 2.3,
      "topChannel": "Organic Search",
      "undervaluedChannel": "Social"
    },
    "insights": [...]
  }
}
```

---

## 異常検知 API

`GET /api/analytics/anomalies`

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| refresh | boolean | false | キャッシュを無視 |
| threshold | number | 2 | 検知閾値（σ倍率） |

### 検知ロジック

- **2σ以上の乖離**: warning
- **3σ以上の乖離**: critical
- **前週比±30%以上**: 異常として検知

### レスポンス

```json
{
  "data": {
    "analyzedAt": "2025-01-29T10:00:00.000Z",
    "period": {
      "analysisStart": "2025-01-28",
      "analysisEnd": "2025-01-28",
      "comparisonStart": "2025-01-21",
      "comparisonEnd": "2025-01-27"
    },
    "summary": {
      "totalAnomalies": 1,
      "criticalCount": 0,
      "warningCount": 1,
      "healthStatus": "warning"
    },
    "anomalies": [
      {
        "metric": "直帰率",
        "currentValue": 58.5,
        "expectedValue": 48.2,
        "deviation": 21.4,
        "severity": "warning",
        "direction": "increase",
        "description": "直帰率が58.5%で、期待値48.2%から21.4%増加しています（悪化）"
      }
    ],
    "metrics": {
      "sessions": {
        "current": 1850,
        "expected": 1780,
        "stats": {
          "mean": 1780,
          "stdDev": 150,
          "min": 1520,
          "max": 2010,
          "values": [...]
        }
      }
    },
    "recommendations": [...]
  }
}
```

---

## Web Vitals API

`GET /api/analytics/web-vitals`

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| refresh | boolean | false | キャッシュを無視 |
| period | string | 30days | 期間（7days/14days/30days） |

### メトリクス閾値（Google推奨）

| メトリクス | Good | Needs Improvement | Poor |
|-----------|------|-------------------|------|
| LCP | ≤2500ms | ≤4000ms | >4000ms |
| FID | ≤100ms | ≤300ms | >300ms |
| CLS | ≤0.1 | ≤0.25 | >0.25 |
| FCP | ≤1800ms | ≤3000ms | >3000ms |
| TTFB | ≤800ms | ≤1800ms | >1800ms |

### レスポンス

```json
{
  "data": {
    "period": {
      "startDate": "30daysAgo",
      "endDate": "today"
    },
    "overview": {
      "avgLCP": 2200,
      "avgFID": 95,
      "avgCLS": 0.08,
      "avgFCP": 1500,
      "avgTTFB": 650,
      "overallScore": 78,
      "goodPagePercentage": 65
    },
    "byPage": [
      {
        "page": "/",
        "lcp": { "metric": "LCP", "value": 1800, "rating": "good", ... },
        "fid": { ... },
        "cls": { ... },
        "fcp": { ... },
        "ttfb": { ... },
        "overallScore": 85
      }
    ],
    "byDevice": [
      { "device": "desktop", "lcp": 1900, "fid": 75, "cls": 0.06, "score": 82 },
      { "device": "mobile", "lcp": 2700, "fid": 125, "cls": 0.11, "score": 68 }
    ],
    "trends": [...],
    "insights": {
      "slowestPages": ["/knowledge/service-form", ...],
      "fastestPages": ["/", ...],
      "needsAttention": [...]
    },
    "recommendations": [...]
  }
}
```

---

## Slack通知 Cron

### 週次サマリー

`GET /api/cron/slack-weekly-summary`

- **スケジュール**: 毎週月曜 0:00 UTC (JST 9:00)
- **認証**: `Authorization: Bearer {CRON_SECRET}`

### 日次アラート

`GET /api/cron/slack-daily-alert`

- **スケジュール**: 毎日 0:00 UTC (JST 9:00)
- **認証**: `Authorization: Bearer {CRON_SECRET}`

### 異常検知アラート

`GET /api/cron/slack-anomaly-alert`

- **スケジュール**: 毎日 1:00 UTC (JST 10:00)
- **認証**: `Authorization: Bearer {CRON_SECRET}`
- **動作**: 異常検知APIを呼び出し、異常があればSlack通知

---

## 使用例

### cURL

```bash
# コホート分析
curl "http://localhost:3000/api/analytics/cohorts?weeks=8"

# アトリビューション（Linearモデル）
curl "http://localhost:3000/api/analytics/attribution?model=linear"

# 異常検知（強制リフレッシュ）
curl "http://localhost:3000/api/analytics/anomalies?refresh=true"

# Cron テスト
curl -X GET "http://localhost:3000/api/cron/slack-weekly-summary" \
  -H "Authorization: Bearer your-cron-secret"
```

### JavaScript

```typescript
// コホート分析の取得
const response = await fetch('/api/analytics/cohorts?weeks=8')
const { data } = await response.json()

console.log(data.insights.retentionTrend) // "improving"
console.log(data.cohorts[0].retention.week1) // 45.2
```
