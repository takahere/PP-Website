---
description: 新規Lab記事を作成（アウトライン生成からスラッグ作成まで）
argument-hint: <タイトルまたはキーワード> [--type research|interview|knowledge]
allowed-tools: Read, WebFetch, Bash(curl:*)
---

# 新規Lab記事作成

ユーザーの入力: $ARGUMENTS

## 概要

新しいLab記事を作成するためのワークフローを実行します。

## 実行手順

### 1. 引数解析

入力から以下を抽出:
- **タイトル/キーワード**: 記事のテーマ
- **--type**: 記事タイプ（デフォルト: knowledge）
  - `research` - リサーチ記事（市場調査、トレンド分析）
  - `interview` - インタビュー記事（成功事例、導入事例）
  - `knowledge` - ナレッジ記事（ハウツー、用語解説）

### 2. サーバー稼働確認

Next.jsサーバーが起動しているか確認:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "サーバー未起動"
```

起動していない場合:
```
cd partnerprop-website && npm run dev
```

### 3. スラッグ生成

タイトルから英数字のスラッグを生成:
- 日本語 → ローマ字変換
- スペース → ハイフン
- 小文字化
- 特殊文字除去

例: "パートナーマーケティング入門" → "partner-marketing-introduction"

### 4. 重複チェック

既存スラッグとの重複を確認:
```bash
curl -s "http://localhost:3000/api/lab/check-slug?slug=generated-slug"
```

重複がある場合は連番を付与: `slug-2`, `slug-3`

### 5. アウトライン生成

AI Writerでアウトラインを生成:
```bash
curl -X POST http://localhost:3000/api/ai-writer/outline \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "キーワード",
    "additionalContext": "記事タイプ: knowledge"
  }'
```

### 6. 結果表示

以下の情報を表示:
1. 生成されたスラッグ
2. 提案されたタイトル
3. アウトライン構成
4. SEO用ディスクリプション案
5. 次のステップ（管理画面URL）

## 出力フォーマット

```markdown
## 記事作成準備完了

**スラッグ**: `generated-slug`
**タイプ**: knowledge
**タイトル案**: SEOを意識したタイトル

### アウトライン

1. **H2: 導入見出し**
   - H3: 小見出し1
   - H3: 小見出し2
2. **H2: 本論見出し**
   ...

### SEO設定

- **seo_description**: 120文字以内の説明文...
- **キーワード**: 関連キーワード1, 関連キーワード2

### 次のステップ

管理画面で編集: http://localhost:3000/admin/lab/new
```

## 注意事項

- スラッグは一度決定すると変更しにくい（SEO影響）
- タイトルは40文字以内を推奨
- 記事タイプは後から変更可能
