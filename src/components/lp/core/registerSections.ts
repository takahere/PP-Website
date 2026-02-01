import { registerSection } from './registry'

// セクション定義をインポート
import { heroDefinition } from '../sections/hero'
import { featuresDefinition } from '../sections/features'
import { benefitsDefinition } from '../sections/benefits'
import { ctaDefinition } from '../sections/cta'
import { formDefinition } from '../sections/form'

/**
 * 全セクションをレジストリに登録
 *
 * 新しいセクションを追加する場合:
 * 1. sections/ ディレクトリに新しいセクションフォルダを作成
 * 2. types.ts, config.ts, Section.tsx, Editor.tsx, index.ts を作成
 * 3. ここにimport文とregisterSection()を追加
 */
export function registerAllSections(): void {
  registerSection(heroDefinition)
  registerSection(featuresDefinition)
  registerSection(benefitsDefinition)
  registerSection(ctaDefinition)
  registerSection(formDefinition)
}

// 自動登録（モジュール読み込み時に実行）
registerAllSections()
