---
description: 既存記事の編集（タイトル、本文、SEO設定の更新）
argument-hint: <slug> [--field title|content|seo]
allowed-tools: Read, WebFetch, Bash(curl:*)
---

# 記事編集

ユーザーの入力: $ARGUMENTS

## 概要

既存のLab記事を編集します。特定フィールドのみの更新も可能です。

## 実行手順

### 1. 引数解析

- **slug**: 編集する記事のスラッグ（必須）
- **--field**: 編集対象フィールド（省略時は全体確認）
  - `title` - タイトルのみ
  - `content` - 本文のみ
  - `seo` - SEO設定（seo_description, og_description, thumbnail）
  - `categories` - カテゴリ設定
  - `tags` - タグ設定

### 2. 記事取得

```bash
curl -s "http://localhost:3000/api/lab/[slug]"
```

### 3. 現在の状態表示

```markdown
## 現在の記事情報

**タイトル**: 現在のタイトル
**スラッグ**: slug
**タイプ**: knowledge
**状態**: 公開済み / 下書き

### SEO設定
- seo_description: 現在の説明文...
- og_description: OGP用説明文...
- thumbnail: /images/thumbnail.jpg

### カテゴリ・タグ
- カテゴリ: agency, prm
- タグ: パートナーマーケティング, PRM
```

### 4. 編集内容の確認

ユーザーに何を変更するか確認:

```markdown
何を編集しますか？

1. タイトル
2. 本文
3. SEO設定（seo_description, og_description, thumbnail）
4. カテゴリ・タグ
5. その他（具体的に指定）
```

### 5. 変更の実行

#### タイトル変更
```markdown
新しいタイトルを入力してください（40文字以内推奨）:

現在: 「現在のタイトル」
```

#### 本文編集
```markdown
本文の編集方法を選択してください:

1. 全文書き換え
2. セクション追加（AI Writer使用）
3. 特定セクションの修正
4. 管理画面で編集（URLを表示）
```

#### SEO設定
```markdown
SEO設定を編集:

1. **seo_description** (現在: 100文字)
   新しい説明文（120文字以内）:

2. **og_description** (現在: 未設定)
   SNS用説明文（100文字以内）:

3. **thumbnail** (現在: /images/thumb.jpg)
   新しい画像パス:
```

### 6. 変更確認

```markdown
## 変更内容確認

| フィールド | 変更前 | 変更後 |
|-----------|-------|-------|
| title | 旧タイトル | 新タイトル |
| seo_description | 旧説明 | 新説明 |

この変更を適用しますか？
```

### 7. 更新実行

ユーザー承認後:
- Server Action経由で更新
- キャッシュ再検証実行

### 8. 更新後確認

```bash
# 更新が反映されているか確認
curl -s "http://localhost:3000/api/lab/[slug]"
```

## 出力フォーマット

### 更新成功
```markdown
## 更新完了

**記事**: タイトル
**更新日時**: 2024-01-15 10:30:00

### 変更内容
- title: 「旧タイトル」→「新タイトル」
- seo_description: 更新済み

### 確認
- 管理画面: http://localhost:3000/admin/lab/[slug]/edit
- 公開ページ: http://localhost:3000/lab/category/slug
```

### 注意が必要な変更
```markdown
## 注意: URLに影響する変更

スラッグの変更はSEOに影響します:
- 現在のURL: /lab/category/old-slug
- 新しいURL: /lab/category/new-slug

この変更を行う場合:
1. 301リダイレクトを自動設定します
2. GSCでの順位に一時的に影響が出る可能性があります

続行しますか？
```

## 編集可能フィールド

| フィールド | 説明 | 注意点 |
|-----------|------|-------|
| title | タイトル | 40文字以内推奨 |
| content_html | 本文HTML | TipTapエディタ形式 |
| seo_description | SEO説明 | 120文字以内 |
| og_description | OGP説明 | SNSシェア用 |
| thumbnail | サムネイル | パスまたはURL |
| categories | カテゴリ | 配列形式 |
| tags | タグ | 配列形式 |
| content_type | 記事タイプ | research/interview/knowledge |

## 注意事項

- slug の変更は非推奨（リダイレクト設定が必要）
- 公開済み記事の大幅な変更は慎重に
- 更新後は自動でキャッシュ再検証される
