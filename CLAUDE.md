# PartnerProp Website

## プロジェクト概要

PartnerPropのウェブサイトプロジェクト。Next.js 16 + TypeScript + Supabase を使用。

## 行動原則

1. **自分で全部やらない** - 専門領域はSubAgentに委譲
2. **タスクを分解** - 大タスクは小タスクに分解、そもそもAI単体じゃ不可能なことは人間に戻す
3. **ユーザーと完全に認識を合わせる** - 曖昧なものは全て、AskUserQuestion Toolを細分化してヒヤリング必須

## 最重要事項: SEO維持

**移行・変更時はSEO維持が最優先**

- URL構造の変更は原則禁止（既存URLを維持）
- やむを得ずURLを変更する場合は必ず301リダイレクトを設定
- canonical URLの整合性を常に確認
- sitemap.xmlには正規URLのみを含める
- 外部被リンクが多いページは特に慎重に扱う
- Google Search Consoleでの監視を継続

## 技術スタック

- **フレームワーク**: Next.js 16.1.1 (App Router)
- **言語**: TypeScript
- **データベース**: Supabase
- **スタイリング**: Tailwind CSS
- **AI統合**: OpenAI, Claude Agent SDK
- **アナリティクス**: GA4, Google Search Console

## CSS設計原則

**AdminとサイトのCSSは完全に分離する**

| 領域 | CSSファイル | スコープ |
|------|------------|---------|
| Admin | `/src/styles/admin.css` | `.admin-layout` |
| Site | `/src/styles/legacy/*`, `/src/styles/site.css` | `.site-layout` |
| 共通 | `/src/app/globals.css` | Tailwind設定のみ |

### ルール
- Legacy CSSのグローバルセレクタ（`html`, `body`, `*`, `a`など）は禁止
- 新規CSSは必ず `.site-layout` または `.admin-layout` でスコープ化すること
- globals.css は Tailwind の設定とデザインシステム変数のみ

## Analytics API 設定

### 必要な環境変数

| 変数名 | 用途 | 取得方法 |
|--------|------|----------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google API認証 | GCPサービスアカウントのJSONキー |
| `GA4_PROPERTY_ID` | GA4プロパティ識別 | GA4管理画面 > プロパティ設定 |
| `GSC_SITE_URL` | GSCサイト識別 | `https://partner-prop.com/` 形式 |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot API認証 | HubSpot設定 > プライベートアプリ |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` | フォーム表示 | HubSpotアカウントのPortal ID |

### 実装済みAPIエンドポイント

| エンドポイント | データソース | 取得データ |
|---------------|-------------|-----------|
| `/api/analytics/gsc` | GSC | imp, clicks, CTR, position（クエリ別・ページ別） |
| `/api/analytics/ga` | GA4 | Session, PV, bounce rate, engagement, channels, devices |
| `/api/analytics/geo` | GA4 | 地域別（国・都道府県・市区町村）ユーザー分布 |
| `/api/analytics/landing-pages` | GA4 | ランディングページ別パフォーマンス・CVR |
| `/api/analytics/exit-pages` | GA4 | 離脱ページ分析・改善優先度 |
| `/api/analytics/lab-metrics` | GA4 | Lab専用: UU, PV, DL数, CVR（月次推移） |
| `/api/analytics/lab-transition` | GA4 | **Transition Rate**: Lab→サービスサイト遷移率 |
| `/api/analytics/lab-bottleneck` | GSC+GA4 | **ボトルネック診断**: 記事別自動分類 |
| `/api/analytics/lab-channel-effect` | GA4 | **チャネル別Lab効果**: 流入元別の遷移率分析 |
| `/api/analytics/non-brand-search` | GSC | **非指名検索流入**: ブランド除外キーワード分析 |
| `/api/analytics/service-cvr` | GA4 | **サービスサイトCVR**: KPI公式完成に必須 |
| `/api/analytics/hubspot-forms` | HubSpot | フォーム送信データ |

### Lab KPI計算式

```
CV = imp × CTR × Transition Rate × サービスサイトCVR
```

| 指標 | 変数 | データソース |
|------|------|-------------|
| 集客力 | Session（UU） | GA4 |
| 送客力 | Transition Rate（Lab→サービスサイト遷移率） | GA4 |
| 成約力 | サービスサイトCVR | GA4 + HubSpot |
| 成果 | Total CV | HubSpot |

### ボトルネック診断ロジック

| 状況 | 判定条件 | 注力変数 |
|------|---------|---------|
| 順位高いが流入少ない | position ≤ 10 & CTR < 3% | CTR |
| 流入多いがCVしない | Session多 & CVR < 1% | CVR |
| 順位低い・圏外 | position > 20 | Impressions |

## MCP vs API

| 項目 | MCP | API |
|------|-----|-----|
| **使う人** | Claude Code（AI） | コード・アプリ |
| **呼び出し方** | 自然言語で依頼 | コードで `fetch()` |
| **用途** | 会話中にデータ取得 | ダッシュボード機能 |

### 設定済みMCP
- `google-analytics` - GA4データ取得（Claude Codeから直接質問可能）
- `gsc` - GSCデータ取得（Claude Codeから直接質問可能）

### 使用例
Claude Codeに「今月のPV数は？」「検索キーワードのTop5は？」と聞くとMCP経由でリアルタイム取得
