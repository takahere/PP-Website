import type { SectionDefinition, VariantOption } from './types'

/**
 * セクションレジストリ
 * 全てのセクション定義を管理
 */
class SectionRegistry {
  private sections = new Map<string, SectionDefinition<unknown>>()

  /**
   * セクション定義を登録
   */
  register<T>(definition: SectionDefinition<T>): void {
    if (this.sections.has(definition.type)) {
      console.warn(
        `[SectionRegistry] Section type "${definition.type}" is already registered. Overwriting.`
      )
    }
    this.sections.set(definition.type, definition as SectionDefinition<unknown>)
  }

  /**
   * セクション定義を取得
   */
  get<T = Record<string, unknown>>(type: string): SectionDefinition<T> | undefined {
    return this.sections.get(type) as SectionDefinition<T> | undefined
  }

  /**
   * セクションタイプが存在するか確認
   */
  has(type: string): boolean {
    return this.sections.has(type)
  }

  /**
   * 全てのセクション定義を取得
   */
  getAll(): SectionDefinition<unknown>[] {
    return Array.from(this.sections.values())
  }

  /**
   * 全てのセクションタイプを取得
   */
  getAllTypes(): string[] {
    return Array.from(this.sections.keys())
  }

  /**
   * セクションタイプのラベルを取得
   */
  getLabel(type: string): string {
    return this.sections.get(type)?.label ?? type
  }

  /**
   * セクションタイプの説明を取得
   */
  getDescription(type: string): string {
    return this.sections.get(type)?.description ?? ''
  }

  /**
   * セクションタイプのバリアントを取得
   */
  getVariants(type: string): VariantOption[] {
    return this.sections.get(type)?.variants ?? []
  }

  /**
   * セクションタイプのデフォルトコンテンツを取得
   */
  getDefaultContent<T = Record<string, unknown>>(type: string): T {
    const definition = this.sections.get(type)
    if (!definition) {
      return {} as T
    }
    return Object.assign({}, definition.defaultContent) as T
  }

  /**
   * ラベルマップを取得（後方互換性）
   */
  getLabelMap(): Record<string, string> {
    const map: Record<string, string> = {}
    for (const [type, def] of this.sections) {
      map[type] = def.label
    }
    return map
  }

  /**
   * 説明マップを取得（後方互換性）
   */
  getDescriptionMap(): Record<string, string> {
    const map: Record<string, string> = {}
    for (const [type, def] of this.sections) {
      map[type] = def.description
    }
    return map
  }

  /**
   * デフォルトコンテンツマップを取得（後方互換性）
   */
  getDefaultContentMap(): Record<string, Record<string, unknown>> {
    const map: Record<string, Record<string, unknown>> = {}
    for (const [type, def] of this.sections) {
      map[type] = Object.assign({}, def.defaultContent) as Record<string, unknown>
    }
    return map
  }
}

// シングルトンインスタンス
export const sectionRegistry = new SectionRegistry()

// ヘルパー関数
export function registerSection<T>(definition: SectionDefinition<T>): void {
  sectionRegistry.register(definition)
}

export function getSection<T = Record<string, unknown>>(
  type: string
): SectionDefinition<T> | undefined {
  return sectionRegistry.get<T>(type)
}

export function getAllSections(): SectionDefinition<unknown>[] {
  return sectionRegistry.getAll()
}

export function getAllSectionTypes(): string[] {
  return sectionRegistry.getAllTypes()
}
