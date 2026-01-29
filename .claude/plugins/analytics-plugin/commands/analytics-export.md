---
description: アナリティクスデータをCSV/JSON形式でエクスポート
argument-hint: <csv|json> [データ種別]
allowed-tools: Read, Write, Bash(curl:*)
---

# アナリティクスデータエクスポート

エクスポート設定: $ARGUMENTS

## 実行手順

### 1. パラメータ解析
- 形式: `csv` または `json`（デフォルト: csv）
- データ種別: `all`, `traffic`, `conversions`, `search`, `channels`（デフォルト: all）

### 2. データ取得
指定されたデータ種別に応じてAPIからデータを取得:

```bash
# トラフィックデータ
curl -s http://localhost:3000/api/analytics/ga

# コンバージョンデータ
curl -s http://localhost:3000/api/analytics/events

# 検索データ
curl -s http://localhost:3000/api/analytics/gsc

# チャネルデータ
curl -s http://localhost:3000/api/analytics/acquisition
```

### 3. データ変換

#### CSV形式の場合
```csv
date,users,sessions,pageviews,bounceRate,avgSessionDuration
2024-01-01,150,195,525,0.45,145
...
```

#### JSON形式の場合
```json
{
  "exportDate": "2024-01-20T10:00:00Z",
  "period": {
    "start": "2023-12-21",
    "end": "2024-01-20"
  },
  "data": {
    "traffic": [...],
    "conversions": [...],
    "search": [...],
    "channels": [...]
  }
}
```

### 4. ファイル出力
出力先: `./exports/analytics_YYYYMMDD_HHMMSS.[csv|json]`

```bash
# ディレクトリ作成
mkdir -p ./exports
```

### 5. エクスポート完了通知
- ファイルパス
- レコード数
- ファイルサイズ

## データ種別詳細

### traffic（トラフィック）
| フィールド | 説明 |
|-----------|------|
| date | 日付 |
| users | ユーザー数 |
| sessions | セッション数 |
| pageviews | ページビュー数 |
| bounceRate | 直帰率 |
| avgSessionDuration | 平均セッション時間 |
| engagementRate | エンゲージメント率 |

### conversions（コンバージョン）
| フィールド | 説明 |
|-----------|------|
| eventName | イベント名 |
| eventCount | 発生回数 |
| users | ユニークユーザー数 |
| topPage | 主な発生ページ |

### search（検索）
| フィールド | 説明 |
|-----------|------|
| query | 検索クエリ |
| impressions | 表示回数 |
| clicks | クリック数 |
| ctr | CTR |
| position | 平均順位 |

### channels（チャネル）
| フィールド | 説明 |
|-----------|------|
| channel | チャネル名 |
| users | ユーザー数 |
| sessions | セッション数 |
| percentage | 構成比 |

## レスポンスガイドライン

- **ファイル名**: わかりやすい命名規則
- **エンコーディング**: UTF-8（BOM付きCSVで日本語対応）
- **確認**: エクスポート前にデータのプレビューを表示
- **サイズ警告**: 大きなデータセットの場合は警告
