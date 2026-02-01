/**
 * HTMLコンテンツ内のH2/H3にID属性を付与する（サーバーサイド用）
 */
export function addHeadingIds(html: string): string {
  if (!html) return ''
  
  let counter = 0
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, content) => {
    // 既にIDがある場合はそのまま返す
    if (/id\s*=\s*["']/.test(attrs)) {
      return match
    }
    
    // タグを除去してテキストを取得
    const text = content.replace(/<[^>]*>/g, '').trim()
    
    // 日本語対応のスラッグ生成
    const slug = text
      .toLowerCase()
      .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50)
    
    const id = slug || `heading-${counter++}`
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`
  })
}

/**
 * HTMLコンテンツからH2/H3見出しを抽出する（サーバーサイド用）
 */
export interface TocItem {
  id: string
  text: string
  level: number
}

export function extractHeadings(html: string): TocItem[] {
  if (!html) return []
  
  const items: TocItem[] = []
  let counter = 0
  
  const regex = /<h([23])([^>]*)>(.*?)<\/h\1>/gi
  let match
  
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1])
    const attrs = match[2]
    const content = match[3]
    
    // タグを除去してテキストを取得
    const text = content.replace(/<[^>]*>/g, '').trim()
    if (!text) continue
    
    // 既存のIDを取得、またはスラッグを生成
    const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/)
    let id: string
    
    if (idMatch) {
      id = idMatch[1]
    } else {
      const slug = text
        .toLowerCase()
        .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50)
      id = slug || `heading-${counter++}`
    }
    
    items.push({ id, text, level })
  }
  
  return items
}















