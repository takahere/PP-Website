# PartnerProp アーキテクチャ設計書

## 設計原則

> **DBの役割は公開サイトの表示ではなくインテリジェンス機能のデータ基盤**

この原則により、以下を実現：
- 公開サイトは静的HTMLとして高速・安全に配信
- DBはAI/分析のためのデータレイヤーとして機能
- レビュー・テストの負担を構造的に軽減

---

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Public Site                      │
│              静的HTML (Vercel CDN配信)                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Top LP  │  │  Lab    │  │ Service │  │  News   │         │
│  │  .html  │  │  .html  │  │  .html  │  │  .html  │         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
│           ↓ ビルド時生成 (generateStaticParams)               │
└─────────────────────────────────────────────────────────────┘
                              ↑
                       デプロイ時のみ接続
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                   Layer 2: Data Foundation                   │
│                      Supabase (PostgreSQL)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  articles │ lp_pages │ lp_sections │ seo_scores    │    │
│  │  tags     │ analytics_cache │ ab_variants │ ...    │    │
│  └─────────────────────────────────────────────────────┘    │
│           ↓ リアルタイム接続                ↓ API経由         │
└─────────────────────────────────────────────────────────────┘
          ↓                                      ↓
┌────────────────────────┐      ┌────────────────────────────┐
│  Layer 3a: 入力ツール   │      │  Layer 3b: Intelligence    │
│  ┌──────────────────┐  │      │  ┌──────────────────────┐  │
│  │ Claude Code      │  │      │  │ SEO自動改善ループ     │  │
│  │ (Markdown編集)   │  │      │  │ ボトルネック診断       │  │
│  └──────────────────┘  │      │  │ LP自動生成           │  │
│  ┌──────────────────┐  │      │  │ A/Bテスト最適化       │  │
│  │ Admin Panel      │  │      │  │ KPIダッシュボード     │  │
│  │ (Webエディタ)    │  │      │  └──────────────────────┘  │
│  └──────────────────┘  │      │                            │
└────────────────────────┘      └────────────────────────────┘
```

---

## 各レイヤーの役割

### Layer 1: Public Site（静的HTML）

**特徴:**
- Next.js SSG/ISRによる静的HTML生成
- Vercel CDN（東京リージョン）から高速配信
- ランタイムでのDB接続なし
- 攻撃面が最小限（静的ファイルのみ）

**技術実装:**
```typescript
// 例: /lab/category/[category]/page.tsx
export async function generateStaticParams() {
  const { data: categories } = await supabase
    .from('articles')
    .select('category')
    .distinct()
  return categories?.map(c => ({ category: c.category })) ?? []
}

// ビルド時にHTMLを生成、デプロイ後はDBに依存しない
export default async function CategoryPage({ params }) {
  const articles = await getArticlesByCategory(params.category)
  return <ArticleList articles={articles} />
}
```

**レビュー負担:**
- **軽い**: 静的HTMLなので本番影響が限定的
- デザイン/表示のチェックのみで十分
- DBが壊れてもサイトは動き続ける

### Layer 2: Data Foundation（Supabase）

**役割:**
- コンテンツのマスターデータ保持
- 分析データの蓄積
- AI/インテリジェンス機能のデータソース

**公開サイトとの関係:**
- ビルド時のみ接続（SSG）
- または定期的なISR再生成時のみ接続
- リアルタイム接続は管理画面とAI機能のみ

**テーブル構造:**
| テーブル | 用途 | 公開サイト依存 |
|---------|------|---------------|
| articles | Lab記事 | ビルド時のみ |
| lp_pages | LPメタデータ | ビルド時のみ |
| lp_sections | LPセクション | ビルド時のみ |
| seo_scores | SEOスコア履歴 | なし（Intelligence用） |
| ab_variants | A/Bテスト結果 | なし（Intelligence用） |
| analytics_cache | 分析キャッシュ | なし（Intelligence用） |

### Layer 3a: 入力ツール

**Claude Code（推奨）:**
```bash
# 携帯からでも記事作成可能
claude "Partner Labに新しい記事を追加して。
タイトル: AI時代のCMS選び
カテゴリ: テクノロジー
内容: ..."
```

**メリット:**
- エンジニアにとって最も自然なワークフロー
- Git履歴で変更追跡
- PRレビューで品質担保
- 携帯からでも完全操作可能

**Admin Panel:**
- 非エンジニア向けのWebエディタ
- 記事一覧、編集、プレビュー
- セクションビルダー

### Layer 3b: Intelligence（差別化領域）

**実装済み機能:**
| 機能 | エンドポイント | 状態 |
|------|--------------|------|
| SEOスコアリング | `/api/analytics/gsc` | 稼働中 |
| ボトルネック診断 | `/api/analytics/lab-bottleneck` | 稼働中 |
| Transition Rate | `/api/analytics/lab-transition` | 稼働中 |
| チャネル別効果 | `/api/analytics/lab-channel-effect` | 稼働中 |
| 非指名検索分析 | `/api/analytics/non-brand-search` | 稼働中 |

**今後の機能:**
| 機能 | 内容 | 予定 |
|------|------|------|
| SEO自動改善ループ | スコア→提案→AI生成→適用 | Phase 2 |
| LP自動生成 | キーワード×業種でAI生成 | Phase 3 |
| A/B自動最適化 | 勝者バリアント自動選択 | Phase 3 |

---

## レビュー・テスト戦略

### なぜ重いレビューが不要か

```
従来のCMS:
┌─────────────┐     ┌─────────────┐
│   Editor    │ ──→ │  Database   │ ──→ 公開サイト
└─────────────┘     └─────────────┘
                          ↑
                     変更が即座に反映
                     → 慎重なレビュー必要
```

```
提案アーキテクチャ:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Editor    │ ──→ │  Database   │     │ 静的HTML   │
└─────────────┘     └─────────────┘     └─────────────┘
                          ↓                    ↑
                     ビルド実行          デプロイで反映
                          ↓ ─────────────────→

                     → DBの変更が即座に公開されない
                     → レビューは軽くて済む
```

**リスク分離:**
| 変更対象 | 影響範囲 | レビュー重さ |
|---------|---------|------------|
| 静的HTMLテンプレート | 公開サイト表示 | 軽（表示確認のみ） |
| DB内コンテンツ | ビルドするまで影響なし | 最軽（いつでも修正可） |
| Intelligence機能 | 管理画面のみ | 中（内部ツール） |
| Admin Panel | 内部ツール | 中（内部ツール） |

### テスト戦略

| レイヤー | テスト種別 | 自動化 |
|---------|----------|--------|
| Layer 1 | ビジュアルリグレッション | Playwright |
| Layer 2 | マイグレーションテスト | Supabase CLI |
| Layer 3a | 手動確認で十分 | - |
| Layer 3b | API統合テスト | Vitest |

---

## cursor.com事例からの学び

> **Lee Robinson（Vercel VP of Product）がcursor.comを3日間・$260で移行**

**参照:** https://leerob.com/agents

**実施内容:**
- Headless CMSからRaw Code + Markdownへ移行
- AI（Claude）で作業自動化
- CMSという抽象化レイヤーを排除

**PartnerPropへの適用:**

| cursor.com | PartnerProp |
|------------|-------------|
| Markdown + Git | Markdown + Git + Claude Code |
| 静的サイト生成 | Next.js SSG/ISR |
| CMS排除 | CMS抽象化レイヤー排除 |
| - | + Intelligence Layer（差別化） |

**重要な気づき:**
- 「CMSが必要」という前提自体を疑う
- 編集者がエンジニアなら、コードで直接編集が最速
- 抽象化レイヤーはオーバーヘッドになりうる

---

## コスト分析

### 現状（WordPress並行運用）

| 項目 | 年間コスト |
|------|-----------|
| WPホスティング（2環境） | ¥24-60万 |
| プラグイン/テーマ | ¥12-24万 |
| 保守・アップデート工数 | ¥48-96万 |
| セキュリティ対応 | ¥24-48万 |
| 外部SEOツール | ¥12-36万 |
| **合計** | **¥120-264万** |

### 移行後（Next.js + Supabase）

| 項目 | 年間コスト |
|------|-----------|
| Vercel Pro | ¥2.4万 |
| Supabase Pro | ¥3万 |
| 保守工数 | ¥12-24万（大幅削減） |
| **合計** | **¥17-30万** |

### 移行コスト（一時費用）

| 項目 | コスト |
|------|--------|
| Lab記事移行 | ¥5-15万 |
| デザイン調整 | ¥3-10万 |
| テスト・検証 | ¥2-10万 |
| リダイレクト設定 | ¥0-5万 |
| **合計** | **¥10-40万** |

### ROI

```
年間削減額: ¥100-230万
移行コスト: ¥10-40万
投資回収期間: 約1-2ヶ月
```

---

## 移行ロードマップ

### Phase 1: 基盤確立（2025年2月）

**2/23 Must:**
- [ ] Apple的トップページLP公開
- [ ] partner-prop.com/ リプレイス
- [ ] SEO維持（canonical、リダイレクト）

**2月中 Should:**
- [ ] CI/CDパイプライン構築
- [ ] Sentry導入
- [ ] レートリミット追加

### Phase 2: Lab移行（2025年3月）

**Week 1-2:**
- [ ] Lab記事データ移行
- [ ] generateStaticParams実装
- [ ] リダイレクト設定

**Week 3-4:**
- [ ] WP Lab停止
- [ ] Intelligence機能有効化

### Phase 3: LP量産体制（2025年4月）

- [ ] LP自動生成機能
- [ ] A/Bテスト自動化
- [ ] KPIダッシュボードUI

### Phase 4: 統合基盤化（2025年5月〜）

- [ ] リリースノート統合
- [ ] 全社CMS基盤化
- [ ] プロダクト転用検討

---

## Intelligence Layer ビジョン

### 4つの柱

```
┌─────────────────────────────────────────────────────────────┐
│                    Intelligence Layer                        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Predict   │  │  Autonomy   │  │   Amplify   │         │
│  │  予測する    │  │  自律する    │  │  増幅する    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│                    ┌─────────────┐                          │
│                    │  Compound   │                          │
│                    │  複利で育つ  │                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

**Predict（予測する）:**
- 「この記事は3ヶ月後にどのキーワードで上位表示されるか」
- 「このLPのCVRはどれくらいになるか」
- トレンド予測、機会発見

**Autonomy（自律する）:**
- SEO改善の自動実行
- CTAの自動最適化
- 低パフォーマンス記事の自動リライト提案

**Amplify（増幅する）:**
- 1記事から10バリエーション生成
- 成功パターンの横展開
- マルチチャネル展開（SNS、メール）

**Compound（複利で育つ）:**
- 書けば書くほど次の記事の質が上がる
- データが溜まるほど予測精度が向上
- コンテンツが資産として複利成長

### Multi-Agent Content Operations

```
┌─────────────────────────────────────────────────────────────┐
│                   Content Command Center                     │
│                        (Orchestrator)                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Analytics  │       │   Writer    │       │    SEO      │
│    Agent    │       │   Agent     │       │   Agent     │
│             │       │             │       │             │
│ GA4/GSC分析 │       │ AI記事生成   │       │ 順位/CTR    │
│ ボトルネック │       │ リライト     │       │ 最適化      │
│ 診断        │       │ LP生成      │       │             │
└─────────────┘       └─────────────┘       └─────────────┘
        ↓                     ↓                     ↓
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ Transition  │       │ Personalize │       │   Growth    │
│   Agent     │       │    Agent    │       │   Agent     │
│             │       │             │       │             │
│ Lab→サービス│       │ ユーザー別   │       │ 新規キーワード│
│ 導線最適化  │       │ コンテンツ  │       │ 発見         │
└─────────────┘       └─────────────┘       └─────────────┘
```

### Living Content（自己進化するコンテンツ）

**従来:**
```
公開 → 放置 → 陳腐化 → 手動更新（忘れがち）
```

**Living Content:**
```
公開 → 監視 → 自動診断 → 改善提案 → 承認 → 自動更新
       ↑                                        │
       └────────────────────────────────────────┘
                    継続的改善ループ
```

**実装イメージ:**
```typescript
// 週次で実行される自動改善ジョブ
async function weeklyContentImprovement() {
  // 1. パフォーマンス低下記事を特定
  const underperformers = await detectUnderperformers()

  // 2. 各記事の改善提案を生成
  for (const article of underperformers) {
    const diagnosis = await diagnoseBottleneck(article)
    const suggestion = await generateImprovement(article, diagnosis)

    // 3. Slack通知でレビュー依頼
    await notifyForReview(article, suggestion)
  }
}
```

---

## このアーキテクチャでAI Agentが機能する理由

### 疎結合による自由度

```
従来のCMS:
Editor → CMS → 公開サイト
         ↑
      AI Agent が介入しにくい
      （CMSの制約に縛られる）
```

```
提案アーキテクチャ:
Editor ─────→ DB ←───── AI Agent
              ↓           ↓
         ビルド時      自由に操作
              ↓
         静的HTML

AI Agentは公開サイトに影響を与えずに
DBを自由に操作・分析できる
```

### 具体的なAgent活用例

**1. SEO Agent:**
```
GSCデータ分析 → 順位低下記事特定 → 改善提案生成 → DB更新（draft）
→ 人間がレビュー → 承認 → ビルド実行 → 公開
```

**2. LP Generation Agent:**
```
キーワード入力 → 競合分析 → セクション生成 → DB保存（draft）
→ 人間がレビュー → 承認 → ビルド実行 → 公開
```

**3. Analytics Agent:**
```
定期的にGA4/GSC取得 → 異常検知 → アラート → 対応提案
→ 人間が判断 → 対応実行
```

---

## まとめ

### 設計原則の効果

| 原則 | 効果 |
|------|------|
| DBは表示用ではなくIntelligence用 | 公開サイトの安定性向上 |
| 静的HTML配信 | セキュリティ・速度向上 |
| レイヤー分離 | レビュー負担軽減 |
| AI Agent対応アーキテクチャ | 将来の自動化が容易 |

### hishinumaさん・ibarakiさんへの回答

**Q: フルスクラッチで品質評価コストが増大するのでは？**

A: **構造的に軽減されます。**
- 公開サイトは静的HTML → DBの変更が即座に反映されない
- 影響範囲が限定的 → 重いレビューは不要
- cursor.com事例：3日で移行、レビュー負担なし

**Q: 70人日、半年〜1年かかるのでは？**

A: **2-3週間で主要移行完了可能。**
- 既存コードベースが充実（セクションビルダー、API等）
- AI（Claude Code）で作業加速
- 静的HTML化で検証負担が少ない

**Q: Takaさん一人で大丈夫？**

A: **大部分は可能。DB周りのみエンジニア支援が望ましい。**
- フロントエンド/API: Takaさんで対応可能
- DB設計/マイグレーション: 1-2日のエンジニア支援
- セキュリティレビュー: 必要に応じて依頼

---

## 参考資料

- [Lee Robinson - Building Cursor.com with AI Agents](https://leerob.com/agents)
- [Vercel - Incremental Static Regeneration](https://vercel.com/docs/incremental-static-regeneration)
- [Supabase - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
