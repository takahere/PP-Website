---
description: GA4/GSCデータを分析（トラフィック、コンバージョン、検索パフォーマンス）
argument-hint: <質問>
allowed-tools: Read, WebFetch, Bash(curl:*)
---

# GA4/GSC アナリティクス分析

ユーザーの質問: $ARGUMENTS

## 実行手順

### 1. サーバー稼働確認
まず、Next.jsサーバーが起動しているか確認してください。
起動していない場合は、ユーザーに以下を案内:
```
cd partnerprop-website && npm run dev
```

### 2. 仮説生成
ユーザーのリクエストから、どのようなデータが必要かを推測します。

**利用可能なデータソース:**

| カテゴリ | エンドポイント | 説明 |
|---------|--------------|------|
| トラフィック | `/api/analytics/ga` | ユーザー数、セッション、PV、直帰率、エンゲージメント |
| リアルタイム | `/api/analytics/realtime` | 現在のアクティブユーザー |
| トレンド | `/api/analytics/trends` | 日別・週別・月別の推移 |
| 検索 | `/api/analytics/gsc` | 検索クエリ、表示回数、CTR、順位 |
| コンバージョン | `/api/analytics/events` | カスタムイベント（資料DL、デモ申込等） |
| チャネル | `/api/analytics/acquisition` | 流入元別分析 |
| キャンペーン | `/api/analytics/campaigns` | キャンペーン効果測定 |
| ページ | `/api/analytics/page-performance` | ページ別パフォーマンス |
| ランディング | `/api/analytics/landing-pages` | LP分析 |
| 離脱 | `/api/analytics/exit-pages` | 離脱ページ分析 |
| ユーザー行動 | `/api/analytics/user-funnel` | ファネル分析 |
| セグメント | `/api/analytics/user-segments` | ユーザーセグメント |
| エンゲージメント | `/api/analytics/engagement` | エンゲージメント指標 |
| コホート | `/api/analytics/cohorts` | コホート分析 |
| サイト内検索 | `/api/analytics/site-search` | サイト内検索分析 |
| Web Vitals | `/api/analytics/web-vitals` | Core Web Vitals |
| 技術環境 | `/api/analytics/tech-environment` | ブラウザ・OS・デバイス |
| Lab | `/api/analytics/lab-metrics` | Partner Lab記事分析 |
| Lab帰属 | `/api/analytics/lab-attribution` | Lab記事のアトリビューション |
| フォーム | `/api/analytics/form-analysis` | フォーム分析 |
| カスタムディメンション | `/api/analytics/custom-dimensions` | 独自定義のディメンション |
| インデックス状況 | `/api/analytics/gsc-index` | URLのインデックス登録状態 |
| GSC詳細 | `/api/analytics/gsc-detailed` | 検索タイプ・デバイス・国別の検索データ |
| デモグラフィック | `/api/analytics/demographics` | 年齢・性別・興味関心 |
| 地域 | `/api/analytics/geo` | 国・都道府県・市区町村別 |
| 広告（Google Ads） | `/api/analytics/ads` | 広告費用・CPC・ROAS・キャンペーン別 |
| サイトマップ | `/api/analytics/sitemaps` | サイトマップ登録状況・インデックス数 |
| コンテンツメタデータ | `/api/analytics/content-metadata` | 全コンテンツの集計・古いコンテンツ検出 |
| カテゴリ分析 | `/api/analytics/content-categories` | カテゴリ別記事数・最新記事 |
| タグ分析 | `/api/analytics/content-tags` | タグ別使用状況・トレンドタグ |
| 著者分析 | `/api/analytics/content-authors` | 著者情報・プロフィール完成度 |
| HubSpotフォーム | `/api/analytics/hubspot-forms` | フォーム一覧・送信数 |
| SEO監査 | `/api/analytics/seo-audit` | SEO/OG設定率・画像alt監査 |
| メンバーデータ | `/api/analytics/members-data` | メンバー情報・SNSリンク |

### 2.1 カスタム期間の指定
すべてのGA4エンドポイントは `startDate` と `endDate` パラメータに対応:
```bash
# 過去90日間のデータ
curl -s "http://localhost:3000/api/analytics/ga?startDate=90daysAgo&endDate=today"

# 特定期間
curl -s "http://localhost:3000/api/analytics/ga?startDate=2024-01-01&endDate=2024-01-31"
```

### 2.2 カスタムディメンションの取得
```bash
curl -s "http://localhost:3000/api/analytics/custom-dimensions?dimension=eventName&metrics=eventCount,activeUsers"
```

### 2.3 インデックス状況の確認
```bash
# 単一URL
curl -s "http://localhost:3000/api/analytics/gsc-index?url=https://partner-prop.com/lab"

# 複数URL（POST）
curl -X POST http://localhost:3000/api/analytics/gsc-index \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://partner-prop.com/", "https://partner-prop.com/lab"]}'
```

### 2.4 GSC詳細データ（検索タイプ・デバイス・国別）
```bash
# 画像検索
curl -s "http://localhost:3000/api/analytics/gsc-detailed?searchType=image"

# モバイルのみ
curl -s "http://localhost:3000/api/analytics/gsc-detailed?device=MOBILE"

# 日本からの検索
curl -s "http://localhost:3000/api/analytics/gsc-detailed?country=jpn"

# 日別データ
curl -s "http://localhost:3000/api/analytics/gsc-detailed?dimension=date"
```

### 2.5 デモグラフィック（年齢・性別）
```bash
curl -s "http://localhost:3000/api/analytics/demographics"
```

### 2.6 地域データ（国・都道府県・市区町村）
```bash
curl -s "http://localhost:3000/api/analytics/geo"
```

### 2.7 Google Adsデータ
```bash
# キャンペーン別
curl -s "http://localhost:3000/api/analytics/ads"

# 広告グループ別
curl -s "http://localhost:3000/api/analytics/ads?groupBy=adGroup"
```

### 2.8 サイトマップ情報
```bash
curl -s "http://localhost:3000/api/analytics/sitemaps"
```

### 2.9 コンテンツメタデータ（Supabase）
```bash
# 全コンテンツの集計
curl -s "http://localhost:3000/api/analytics/content-metadata"

# 古いコンテンツの閾値を変更（デフォルト90日）
curl -s "http://localhost:3000/api/analytics/content-metadata?staleDays=60"
```

### 2.10 カテゴリ分析
```bash
curl -s "http://localhost:3000/api/analytics/content-categories"
```

### 2.11 タグ分析
```bash
# 全タグ（上位50件）
curl -s "http://localhost:3000/api/analytics/content-tags"

# 上位100件
curl -s "http://localhost:3000/api/analytics/content-tags?limit=100"
```

### 2.12 著者分析
```bash
curl -s "http://localhost:3000/api/analytics/content-authors"
```

### 2.13 HubSpotフォーム分析
```bash
# フォーム一覧
curl -s "http://localhost:3000/api/analytics/hubspot-forms"

# 特定フォームの送信データ
curl -s "http://localhost:3000/api/analytics/hubspot-forms?formId=xxx"
```

### 2.14 SEO監査
```bash
# 全テーブル監査
curl -s "http://localhost:3000/api/analytics/seo-audit"

# 特定テーブルのみ
curl -s "http://localhost:3000/api/analytics/seo-audit?table=lab_articles"
```

### 2.15 メンバーデータ
```bash
curl -s "http://localhost:3000/api/analytics/members-data"
```

### 3. データ取得
必要なエンドポイントからデータを取得:
```bash
curl -s http://localhost:3000/api/analytics/[endpoint]
```

### 4. 分析・レポート
取得したデータを分析し、以下の形式でレポート:

1. **サマリー**: 主要な数値とトレンド
2. **詳細分析**: カテゴリ別の深掘り
3. **インサイト**: 気づきと示唆
4. **推奨アクション**: 次に取るべきアクション

## レスポンスガイドライン

- **言語**: 日本語で応答
- **数値**: 具体的な数値を含める
- **比較**: 前週比・前月比を可能な限り提示
- **可視化**: 必要に応じて表形式で表示
