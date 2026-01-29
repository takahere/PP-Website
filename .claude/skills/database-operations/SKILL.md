---
name: database-operations
description: Supabaseデータベースの操作、クエリ実行、マイグレーション支援を行う。データ整合性とセキュリティを重視。「データを取得」「テーブルを確認」などのリクエスト時に使用。
---

# Database Operations Skill

あなたはPartnerPropのデータベース管理スペシャリストです。
Supabaseデータベースの操作とデータ整合性の維持を担当します。

## データベース構造

### コンテンツテーブル

#### `lab_articles` - Lab記事
```sql
CREATE TABLE lab_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content_html text,
  thumbnail text,
  seo_description text,
  og_description text,
  categories text[],
  tags text[],
  content_type text CHECK (content_type IN ('research', 'interview', 'knowledge')),
  is_published boolean DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### `posts` - ニュース/セミナー
```sql
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content_html text,
  thumbnail text,
  seo_description text,
  type text CHECK (type IN ('news', 'seminar')),
  is_published boolean DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### `pages` - 静的ページ
```sql
CREATE TABLE pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content_html text,
  type text CHECK (type IN ('home', 'casestudy', 'knowledge', 'member')),
  seo_description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### `members` - メンバー
```sql
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  position text,
  bio text,
  image text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
```

### マスターテーブル

#### `lab_categories` - カテゴリ
```sql
CREATE TABLE lab_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text
);
```

#### `lab_tags` - タグ
```sql
CREATE TABLE lab_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL
);
```

#### `redirects` - リダイレクト
```sql
CREATE TABLE redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path text UNIQUE NOT NULL,
  to_path text NOT NULL,
  is_permanent boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
```

#### `analysis_sheets` - 分析シート
```sql
CREATE TABLE analysis_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

## Supabaseクライアント

### 読み取り専用クライアント（RLS適用）

```typescript
import { createClient } from '@/lib/supabase/server'

// Server Component / Server Action で使用
const supabase = await createClient()
```

**使用場面**:
- 公開データの取得
- 認証ユーザーのデータ取得
- RLSポリシーに従った操作

### 管理クライアント（RLSバイパス）

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

// Server Action / API Route で使用
const adminClient = createAdminClient()
```

**使用場面**:
- 管理者によるデータ書き込み
- バッチ処理
- RLSをバイパスする必要がある操作

**注意**: Service Role Key を使用するため、サーバーサイドのみで使用

## 標準クエリパターン

### 一覧取得
```typescript
const { data, error } = await supabase
  .from('lab_articles')
  .select('*')
  .eq('is_published', true)
  .order('published_at', { ascending: false })
  .limit(10)
```

### 単一レコード取得
```typescript
const { data, error } = await supabase
  .from('lab_articles')
  .select('*')
  .eq('slug', slug)
  .single()
```

### 条件付き取得（配列フィールド）
```typescript
// categoriesにagencyを含む記事
const { data } = await supabase
  .from('lab_articles')
  .select('*')
  .contains('categories', ['agency'])
```

### 関連データ取得
```typescript
// カテゴリ情報を結合して取得
const { data } = await supabase
  .from('lab_articles')
  .select(`
    *,
    lab_categories!inner(name, slug)
  `)
```

### 挿入
```typescript
const { data, error } = await adminClient
  .from('lab_articles')
  .insert({
    title: '新しい記事',
    slug: 'new-article',
    content_type: 'knowledge',
    is_published: false
  })
  .select('id')
  .single()
```

### 更新
```typescript
const { error } = await adminClient
  .from('lab_articles')
  .update({
    title: '更新後のタイトル',
    updated_at: new Date().toISOString()
  })
  .eq('slug', slug)
```

### 削除
```typescript
// 注意: 削除前に必ずユーザー確認を取る
const { error } = await adminClient
  .from('lab_articles')
  .delete()
  .eq('id', id)
```

## セキュリティルール

### 1. 認証チェック必須

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return { error: '認証が必要です' }
}
```

### 2. 環境変数

| 変数名 | 用途 | 公開 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | 可 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key | 可 |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role | 不可 |

### 3. 書き込み後のキャッシュ再検証

```typescript
import { revalidatePath } from 'next/cache'

// 更新後は関連パスを再検証
revalidatePath('/admin/lab')
revalidatePath('/lab')
revalidatePath(`/lab/${slug}`)
```

## データ検証

### スラッグ重複チェック
```typescript
async function checkSlugUnique(
  table: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from(table)
    .select('id')
    .eq('slug', slug)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query.single()
  return !data // dataがなければユニーク
}
```

### 必須フィールド検証
```typescript
function validateLabArticle(data: Partial<LabArticle>): string[] {
  const errors: string[] = []

  if (!data.title?.trim()) errors.push('タイトルは必須です')
  if (!data.slug?.trim()) errors.push('スラッグは必須です')
  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push('スラッグは英小文字、数字、ハイフンのみ')
  }

  return errors
}
```

## 応答ガイドライン

- クエリ実行前にテーブル構造を確認
- 書き込み操作は必ずユーザー確認を取る
- エラー時は具体的な原因と対処法を提示
- バッチ更新は件数制限を設ける（50件以下推奨）
- 削除操作は特に慎重に（復元不可）

## トラブルシューティング

### よくあるエラー

| エラー | 原因 | 対処 |
|--------|------|------|
| `PGRST116` | レコードが見つからない | slugやidを確認 |
| `23505` | ユニーク制約違反 | 重複チェックを追加 |
| `42501` | 権限不足 | adminClientを使用 |
| `22P02` | 型不正 | 入力値の型を確認 |
