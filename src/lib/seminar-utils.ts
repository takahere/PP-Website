/**
 * セミナーメタデータ抽出ユーティリティ
 * content_html からイベント情報を抽出
 */

export interface SeminarMetadata {
  eventDate: Date | null
  eventDateText: string | null
  isOnline: boolean
  eventLocation: string | null
}

/**
 * content_html からセミナーメタデータを抽出
 */
export function extractSeminarMetadata(contentHtml: string): SeminarMetadata {
  const result: SeminarMetadata = {
    eventDate: null,
    eventDateText: null,
    isOnline: true, // デフォルトはオンライン
    eventLocation: null,
  }

  if (!contentHtml) {
    return result
  }

  // シンプルなHTMLパーサーでテーブルから情報を抽出
  // <td>日時</td><td>...</td> パターンを検出

  // 日時の抽出
  const datePatterns = [
    // パターン1: 「日時」「日程」などの行
    /<t[hd][^>]*>(?:日時|日程|開催日)[^<]*<\/t[hd]>\s*<td[^>]*>([^<]+)/gi,
    // パターン2: より緩い日付パターン
    /(\d{1,2})月(\d{1,2})日[（(]?([日月火水木金土])[）)]?\s*(\d{1,2}):(\d{2})/g,
  ]

  // 日時テーブルセルから抽出
  const dateMatch = contentHtml.match(
    /<t[hd][^>]*>(?:日時|日程|開催日)[^<]*<\/t[hd]>\s*<td[^>]*>([\s\S]*?)<\/td>/i
  )
  if (dateMatch) {
    const dateText = dateMatch[1].replace(/<[^>]+>/g, '').trim()
    result.eventDateText = dateText

    // 日付をパース
    const parsed = parseSeminarDate(dateText)
    if (parsed) {
      result.eventDate = parsed
    }
  }

  // 場所の抽出
  const locationMatch = contentHtml.match(
    /<t[hd][^>]*>(?:場所|会場|開催場所)[^<]*<\/t[hd]>\s*<td[^>]*>([\s\S]*?)<\/td>/i
  )
  if (locationMatch) {
    const locationText = locationMatch[1].replace(/<[^>]+>/g, '').trim()
    result.eventLocation = locationText

    // オンライン判定
    const onlineKeywords = ['オンライン', 'Zoom', 'ウェビナー', 'webinar', 'Web']
    const offlineKeywords = ['会場', 'オフライン', '対面', '現地', '東京', '大阪', 'ビル']

    const isOnlineMatch = onlineKeywords.some((kw) =>
      locationText.toLowerCase().includes(kw.toLowerCase())
    )
    const isOfflineMatch = offlineKeywords.some((kw) =>
      locationText.includes(kw)
    )

    if (isOfflineMatch && !isOnlineMatch) {
      result.isOnline = false
    }
  }

  // タイトルからアーカイブ配信を検出
  if (contentHtml.includes('アーカイブ配信') || contentHtml.includes('【アーカイブ】')) {
    // アーカイブ配信はオンライン扱い
    result.isOnline = true
  }

  return result
}

/**
 * 日付文字列をパース
 * 例: "1月22日（木）12:00-13:00" → Date
 */
function parseSeminarDate(dateText: string): Date | null {
  if (!dateText) return null

  // 現在の年を使用
  const currentYear = new Date().getFullYear()

  // パターン: MM月DD日 HH:MM
  const match = dateText.match(/(\d{1,2})月(\d{1,2})日[^0-9]*(\d{1,2}):(\d{2})/)
  if (match) {
    const month = parseInt(match[1], 10) - 1 // 0-indexed
    const day = parseInt(match[2], 10)
    const hour = parseInt(match[3], 10)
    const minute = parseInt(match[4], 10)

    // 年の推定: 現在より過去の日付なら翌年
    let year = currentYear
    const date = new Date(year, month, day, hour, minute)

    // 過去3ヶ月以上前なら翌年と推定
    const now = new Date()
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    if (date < threeMonthsAgo) {
      year = currentYear + 1
      return new Date(year, month, day, hour, minute)
    }

    return date
  }

  // パターン: YYYY年MM月DD日
  const fullMatch = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (fullMatch) {
    const year = parseInt(fullMatch[1], 10)
    const month = parseInt(fullMatch[2], 10) - 1
    const day = parseInt(fullMatch[3], 10)
    return new Date(year, month, day)
  }

  return null
}

/**
 * セミナーが開催予定かどうかを判定
 */
export function isUpcomingSeminar(metadata: SeminarMetadata): boolean {
  if (!metadata.eventDate) {
    // 日付が取得できない場合は過去扱い
    return false
  }

  const now = new Date()
  return metadata.eventDate > now
}

/**
 * イベント日時をフォーマット
 */
export function formatEventDate(date: Date | null): string {
  if (!date) return ''

  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayName = dayNames[date.getDay()]
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${month}月${day}日（${dayName}）${hours}:${minutes}〜`
}
