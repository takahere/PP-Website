---
description: コンテンツのSEO設定を監査（メタ情報、リダイレクト、内部リンク）
argument-hint: [slug] [--table lab_articles|posts|pages]
allowed-tools: Read, WebFetch, Bash(curl:*)
---

# SEOチェック

ユーザーの入力: $ARGUMENTS

## 概要

指定されたコンテンツまたは全体のSEO設定を監査します。

## 実行手順

### 1. 引数解析

- **slug**: 特定記事をチェック（省略時は全体監査）
- **--table**: テーブル指定（デフォルト: lab_articles）

### 2. サーバー確認

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health
```

### 3. SEO監査実行

#### 全体監査（slugなし）
```bash
curl -s "http://localhost:3000/api/analytics/seo-audit"
```

#### 特定テーブル監査
```bash
curl -s "http://localhost:3000/api/analytics/seo-audit?table=lab_articles"
```

#### 特定記事監査
```bash
# 記事データ取得
curl -s "http://localhost:3000/api/lab/[slug]"

# GSCパフォーマンス確認
curl -s "http://localhost:3000/api/analytics/gsc?page=/lab/[slug]"

# インデックス状況確認
curl -s "http://localhost:3000/api/analytics/gsc-index?url=https://partner-prop.com/lab/[slug]"
```

### 4. チェック項目

#### メタ情報
| 項目 | 基準 | 重要度 |
|-----|------|--------|
| title | 空でない、40文字以内 | 高 |
| seo_description | 空でない、120文字以内 | 高 |
| og_description | 設定されている | 中 |
| thumbnail | OG画像が設定されている | 中 |

#### コンテンツ
| 項目 | 基準 | 重要度 |
|-----|------|--------|
| 本文 | 2000文字以上 | 中 |
| H2見出し | 3-6個 | 中 |
| 内部リンク | 3個以上 | 低 |
| 画像alt | すべて設定 | 中 |

#### URL・リダイレクト
| 項目 | 基準 | 重要度 |
|-----|------|--------|
| スラッグ | 英数字・ハイフンのみ | 高 |
| リダイレクト | 重複なし | 高 |
| canonical | 正しく設定 | 中 |

### 5. 結果表示

## 出力フォーマット

### 全体監査
```markdown
## SEO監査結果

### サマリー

| テーブル | 総数 | SEO完了 | 要改善 |
|---------|-----|--------|-------|
| lab_articles | 50 | 45 | 5 |
| posts | 30 | 28 | 2 |
| pages | 10 | 10 | 0 |

### 要改善コンテンツ

#### lab_articles
1. **article-slug-1**: seo_description が空
2. **article-slug-2**: title が45文字（40文字超過）

#### posts
1. **news-slug-1**: og_description が空
```

### 特定記事監査
```markdown
## SEO監査: article-slug

### スコア: 85/100

### チェック結果

| 項目 | 状態 | 詳細 |
|-----|------|------|
| title | ✅ | 38文字 |
| seo_description | ✅ | 115文字 |
| og_description | ⚠️ | 未設定 |
| thumbnail | ✅ | 設定済み |
| 本文 | ✅ | 3,200文字 |
| H2見出し | ✅ | 5個 |
| 内部リンク | ⚠️ | 2個（3個以上推奨） |
| 画像alt | ✅ | 全て設定 |

### GSCパフォーマンス（過去28日）

| 指標 | 値 |
|-----|-----|
| 表示回数 | 1,250 |
| クリック数 | 85 |
| CTR | 6.8% |
| 平均順位 | 12.3 |

### 改善提案

1. **og_description を設定** - SNSシェア時の表示を改善
2. **内部リンクを追加** - 関連記事へのリンクを1-2個追加
```

## 注意事項

- GSCデータは過去28日間のデフォルト
- インデックス状況の反映には数日かかる場合がある
- 重要な変更前はGSCデータを確認すること
