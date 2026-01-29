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
