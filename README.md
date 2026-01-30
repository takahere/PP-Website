# PartnerProp Website

PartnerPropのコーポレートサイト。Next.js 16 + TypeScript + Supabase で構築。

## 技術スタック

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript
- **Database**: Supabase
- **Styling**: Tailwind CSS
- **Analytics**: GA4, Google Search Console
- **Forms**: HubSpot
- **Testing**: Vitest

## 開発環境セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm test
```

## 環境変数

`.env.local` ファイルを作成し、以下の環境変数を設定してください。

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Analytics / Search Console
GOOGLE_SERVICE_ACCOUNT_JSON=
GA4_PROPERTY_ID=
GSC_SITE_URL=

# HubSpot
HUBSPOT_ACCESS_TOKEN=
NEXT_PUBLIC_HUBSPOT_PORTAL_ID=

# Slack通知
SLACK_WEBHOOK_URL=

# Cron / セキュリティ
CRON_SECRET=

# AI
OPENAI_API_KEY=
```

## Analytics API

主要なAnalytics APIエンドポイント:

| Endpoint | Description |
|----------|-------------|
| `/api/analytics/ga` | GA4コアメトリクス |
| `/api/analytics/gsc` | GSCデータ |
| `/api/analytics/cohorts` | コホート分析 |
| `/api/analytics/attribution` | アトリビューション分析 |
| `/api/analytics/anomalies` | 異常検知 |
| `/api/analytics/web-vitals` | Core Web Vitals |
| `/api/analytics/lab-metrics` | Lab専用KPI |

詳細は [API Reference](./docs/api-reference.md) を参照。

## Cron Jobs

| Path | Schedule | Description |
|------|----------|-------------|
| `/api/cron/publish-scheduled` | */5 * * * * | 予約公開 |
| `/api/cron/slack-weekly-summary` | 毎週月曜 9:00 JST | 週次レポート |
| `/api/cron/slack-daily-alert` | 毎日 9:00 JST | 日次KPI |
| `/api/cron/slack-anomaly-alert` | 毎日 10:00 JST | 異常検知通知 |

## テスト

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test

# 特定ファイル
npm test -- tests/api/analytics/cohorts.test.ts

# カバレッジ
npm run test:coverage
```

## プロジェクト構成

```
src/
├── app/
│   ├── api/
│   │   ├── analytics/    # Analytics API
│   │   └── cron/         # Cronジョブ
│   ├── admin/            # 管理画面
│   └── (site)/           # 公開サイト
├── components/           # Reactコンポーネント
├── lib/
│   ├── slack/            # Slack通知
│   ├── supabase/         # Supabaseクライアント
│   └── google-auth.ts    # Google認証
└── styles/               # CSS
```

## デプロイ

Vercelにデプロイ:

```bash
vercel --prod
```

## ライセンス

Private
