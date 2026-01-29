---
description: 記事を公開状態に変更（SEOチェック後に公開）
argument-hint: <slug> [--table lab_articles|posts]
allowed-tools: Read, WebFetch, Bash(curl:*)
---

# 記事公開

ユーザーの入力: $ARGUMENTS

## 概要

下書き状態の記事を公開します。公開前に自動でSEOチェックを実行します。

## 実行手順

### 1. 引数解析

- **slug**: 公開する記事のスラッグ（必須）
- **--table**: テーブル指定（デフォルト: lab_articles）

### 2. 記事存在確認

```bash
curl -s "http://localhost:3000/api/lab/[slug]"
```

### 3. 現在の状態確認

記事の `is_published` を確認:
- `true` → 既に公開済み
- `false` → 下書き状態

### 4. SEOチェック実行

公開前に必須チェック:

```bash
# SEO監査
curl -s "http://localhost:3000/api/analytics/seo-audit?table=lab_articles&slug=[slug]"
```

#### 公開ブロック条件

以下の場合は公開をブロックし、警告を表示:

| 条件 | 理由 |
|-----|------|
| title が空 | 検索結果に表示されない |
| seo_description が空 | メタディスクリプションなし |
| content_html が空 | 本文なし |
| 本文が500文字未満 | コンテンツ不足 |

#### 警告条件（公開は可能）

| 条件 | 推奨アクション |
|-----|--------------|
| og_description が空 | SNSシェア時の表示が最適化されない |
| thumbnail が空 | OG画像なしでシェアされる |
| 内部リンクが0個 | 関連記事へのリンク追加を推奨 |

### 5. 確認プロンプト

SEOチェック結果を表示し、ユーザーに確認:

```markdown
## 公開確認

**記事**: タイトル
**スラッグ**: slug

### SEOチェック結果

- ✅ title: 設定済み
- ✅ seo_description: 設定済み
- ⚠️ og_description: 未設定
- ✅ thumbnail: 設定済み

### 公開しますか？

この操作により:
- 記事が一般公開されます
- サイトマップに追加されます
- Google にインデックス登録がリクエストされます
```

### 6. 公開実行

ユーザーの承認後に実行:

```bash
# 管理画面のServer Actionを呼び出す形で公開
# 実際にはNext.jsのServer Actionを使用
```

公開時に更新するフィールド:
- `is_published`: `true`
- `published_at`: 現在時刻
- `updated_at`: 現在時刻

### 7. 公開後確認

```bash
# キャッシュ再検証が完了しているか確認
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/lab/[slug]"
```

## 出力フォーマット

### 公開成功
```markdown
## 公開完了

**記事**: タイトル
**URL**: https://partner-prop.com/lab/category/slug
**公開日時**: 2024-01-15 10:30:00

### 次のステップ

1. 公開ページを確認: [URL]
2. GSCでインデックス登録をリクエスト
3. SNSでシェア（og_description 設定推奨）
```

### 公開ブロック
```markdown
## 公開できません

以下の問題を解決してください:

1. ❌ **seo_description が空**
   → 管理画面で120文字以内の説明文を設定

2. ❌ **本文が300文字**
   → 最低500文字以上のコンテンツを追加

管理画面で編集: http://localhost:3000/admin/lab/[slug]/edit
```

## 注意事項

- 公開後のURL変更はSEOに影響するため避ける
- 公開後に非公開に戻すことは可能
- インデックス登録には数日かかる場合がある
