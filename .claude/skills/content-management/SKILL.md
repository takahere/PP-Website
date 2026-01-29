---
name: content-management
description: Lab記事・ニュース・静的ページの作成・編集・管理を行う。コンテンツ構造の理解とCMS操作をサポート。「記事を作成」「ページを編集」などのリクエスト時に使用。
---

# Content Management Skill

あなたはPartnerPropのコンテンツ管理スペシャリストです。
Lab記事、ニュース、セミナー情報、静的ページの作成・編集・公開フローを管理します。

## コンテンツタイプ

### 1. Lab記事 (`lab_articles`)
Partner Labの記事コンテンツ

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | uuid | 主キー |
| slug | text | URL識別子（ユニーク） |
| title | text | 記事タイトル |
| content_html | text | 本文HTML |
| thumbnail | text | サムネイル画像パス |
| seo_description | text | SEO用ディスクリプション（120文字以内） |
| og_description | text | OGP用ディスクリプション |
| categories | text[] | カテゴリスラッグの配列 |
| tags | text[] | タグスラッグの配列 |
| content_type | text | research / interview / knowledge |
| is_published | boolean | 公開状態 |
| published_at | timestamp | 公開日時 |

### 2. ニュース/セミナー (`posts`)
お知らせ・イベント情報

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | uuid | 主キー |
| slug | text | URL識別子 |
| title | text | タイトル |
| content_html | text | 本文HTML |
| thumbnail | text | サムネイル画像 |
| seo_description | text | SEO用ディスクリプション |
| type | text | news / seminar |
| is_published | boolean | 公開状態 |
| published_at | timestamp | 公開日時 |

### 3. 静的ページ (`pages`)
固定ページ（会社情報、事例など）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | uuid | 主キー |
| slug | text | URL識別子 |
| title | text | ページタイトル |
| content_html | text | 本文HTML |
| type | text | home / casestudy / knowledge / member |
| seo_description | text | SEO用ディスクリプション |

## ワークフロー

### 新規記事作成

1. **タイプ確認**: どのコンテンツタイプか確認
2. **スラッグ生成**: タイトルからスラッグを自動生成
3. **重複チェック**: 既存スラッグとの重複を確認
4. **アウトライン生成**: AI Writerでアウトライン作成（オプション）
5. **下書き保存**: `is_published: false` で保存
6. **SEO設定**: seo_description, og_description を設定
7. **公開**: `is_published: true`, `published_at` を設定

### 記事編集

1. **既存データ取得**: slugで記事を取得
2. **変更内容確認**: 何を変更するか明確化
3. **更新実行**: 必要なフィールドのみ更新
4. **キャッシュ再検証**: revalidatePath() を呼び出し

### 記事削除

**注意**: 削除前に必ずユーザーに確認を求めること

1. 削除対象の確認
2. 関連リダイレクトの確認
3. 削除実行（ソフトデリートが望ましい）

## API連携

### AI Writer エンドポイント

```typescript
// アウトライン生成
POST /api/ai-writer/outline
{
  "keyword": "パートナーマーケティング 始め方",
  "additionalContext": "BtoB企業向け"
}

// セクション執筆
POST /api/ai-writer/section
{
  "heading": "## パートナーマーケティングとは",
  "context": "初心者向け記事",
  "previousContent": "..."
}

// 内部リンク提案
POST /api/ai-writer/links
{
  "content": "本文テキスト..."
}
```

## Supabase操作パターン

### 読み取り（createClient使用）
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data, error } = await supabase
  .from('lab_articles')
  .select('*')
  .eq('slug', slug)
  .single()
```

### 書き込み（adminClient使用）
```typescript
import { createAdminClient } from '@/lib/supabase/admin'

const adminClient = createAdminClient()
const { data, error } = await adminClient
  .from('lab_articles')
  .insert({
    title,
    slug,
    content_html,
    content_type: 'knowledge',
    is_published: false
  })
  .select('id')
  .single()
```

### 更新後のキャッシュ再検証
```typescript
import { revalidatePath } from 'next/cache'

// 管理画面と公開ページ両方を再検証
revalidatePath('/admin/lab')
revalidatePath('/lab')
revalidatePath(`/lab/${slug}`)
```

## 応答ガイドライン

- コンテンツ作成時はまずタイプを確認
- スラッグは英数字とハイフンのみ（日本語不可）
- 書き込み操作前には必ず確認を求める
- エラー発生時は具体的な原因と対処法を提示

## 管理画面URL

- Lab記事一覧: `/admin/lab`
- Lab記事編集: `/admin/lab/[slug]/edit`
- Lab記事新規: `/admin/lab/new`
- ニュース一覧: `/admin/posts?type=news`
- セミナー一覧: `/admin/posts?type=seminar`
