---
name: analytics-assistant
description: GA4/GSCのデータ分析、トラフィック分析、コンバージョン分析、検索パフォーマンス分析に関する質問に使用
version: 1.0.0
license: MIT
---

# アナリティクスアシスタント

PartnerPropウェブサイトのGA4/GSCデータを分析し、インサイトを提供するスキル。

## いつ使用するか

以下のキーワードやフレーズを含む質問に対応:

- 「GA4」「Google Analytics」「アナリティクス」
- 「トラフィック」「アクセス」「PV」「ページビュー」
- 「コンバージョン」「CV」「イベント」「資料ダウンロード」
- 「検索」「GSC」「Search Console」「SEO」
- 「ユーザー」「セッション」「直帰率」「離脱率」
- 「チャネル」「流入元」「参照元」「オーガニック」
- 「レポート」「分析」「データ」
- 「前週比」「前月比」「トレンド」「推移」

## ワークフロー

### 1. 仮説生成
ユーザーのリクエストから、必要なデータを推測:
- どのデータソースが必要か
- どの期間のデータか
- どのような分析が求められているか

### 2. 確認（信頼度80%未満の場合）
推測に不確かさがある場合、確認質問を生成:
- 「〇〇のデータでよろしいですか？」
- 「期間は過去30日間でよいですか？」

### 3. データ取得
Next.js APIエンドポイントからデータを取得:

```bash
curl -s http://localhost:3000/api/analytics/[endpoint]
```

### 4. 分析・レポート
- 数値の解釈
- トレンドの特定
- 比較分析
- インサイトの抽出

## 利用可能なデータソース

### トラフィック系
| エンドポイント | 説明 | 主な指標 |
|---------------|------|----------|
| `/api/analytics/ga` | GA4基本データ | users, sessions, pageviews, bounceRate, engagementRate |
| `/api/analytics/realtime` | リアルタイム | activeUsers |
| `/api/analytics/trends` | トレンド | 日別・週別・月別推移 |

### 検索系
| エンドポイント | 説明 | 主な指標 |
|---------------|------|----------|
| `/api/analytics/gsc` | Search Console | queries, impressions, clicks, ctr, position |

### コンバージョン系
| エンドポイント | 説明 | 主な指標 |
|---------------|------|----------|
| `/api/analytics/events` | カスタムイベント | eventName, eventCount, users |
| `/api/analytics/form-analysis` | フォーム分析 | formSubmissions, completionRate |

### チャネル系
| エンドポイント | 説明 | 主な指標 |
|---------------|------|----------|
| `/api/analytics/acquisition` | 流入元 | channel, users, sessions, conversionRate |
| `/api/analytics/campaigns` | キャンペーン | campaignName, users, conversions |

### ページ系
| エンドポイント | 説明 | 主な指標 |
|---------------|------|----------|
| `/api/analytics/page-performance` | ページパフォーマンス | pagePath, pageviews, avgEngagementTime |
| `/api/analytics/landing-pages` | ランディングページ | entrances, bounceRate |
| `/api/analytics/exit-pages` | 離脱ページ | exits, exitRate |
| `/api/analytics/content-groups` | コンテンツグループ | category, pageviews |

### ユーザー行動系
| エンドポイント | 説明 | 主な指標 |
|---------------|------|----------|
| `/api/analytics/user-funnel` | ファネル | step, users, dropoffRate |
| `/api/analytics/user-segments` | セグメント | segment, users, behavior |
| `/api/analytics/engagement` | エンゲージメント | engagementRate, avgEngagementTime |
| `/api/analytics/cohorts` | コホート | cohort, retention |
| `/api/analytics/site-search` | サイト内検索 | searchTerm, searches, exits |

### 技術系
| エンドポイント | 説明 | 主な指標 |
|---------------|------|----------|
| `/api/analytics/web-vitals` | Core Web Vitals | LCP, FID, CLS |
| `/api/analytics/tech-environment` | 技術環境 | browser, os, device |
| `/api/analytics/technical-issues` | 技術的問題 | errorType, count |

### Lab系
| エンドポイント | 説明 | 主な指標 |
|---------------|------|----------|
| `/api/analytics/lab-metrics` | Lab記事 | articleId, pageviews, engagementTime |
| `/api/analytics/lab-attribution` | Lab帰属 | source, conversions |
| `/api/analytics/lab-conversion-paths` | Lab CV経路 | path, conversions |

### 拡張機能
| エンドポイント | 説明 | 主な指標 |
|---------------|------|----------|
| `/api/analytics/custom-dimensions` | カスタムディメンション | 任意のディメンション・指標 |
| `/api/analytics/gsc-index` | インデックス状況 | verdict, coverageState, lastCrawlTime |

### カスタム期間指定
すべてのGA4エンドポイントで `startDate` と `endDate` パラメータが使用可能:
- `30daysAgo`, `7daysAgo`, `yesterday`, `today`
- `YYYY-MM-DD` 形式（例: `2024-01-01`）

## レスポンスガイドライン

### 言語
- すべて日本語で応答

### 数値表示
- 大きな数値はカンマ区切り（例: 1,234）
- パーセントは小数点1桁まで（例: 12.3%）
- 時間は「X分Y秒」形式

### 比較表現
- 増加: 「+X%」「X%増」
- 減少: 「-X%」「X%減」
- 横ばい: 「ほぼ横ばい」「微増/微減」

### 構造
1. **サマリー**: 主要な発見を3文以内で
2. **詳細**: 表形式でデータを提示
3. **インサイト**: 数値の意味を解説
4. **推奨**: 次のアクションを提案

### 注意事項
- 推測と事実を区別する
- データがない場合は明示する
- 大きな変動には理由を推測して提示
