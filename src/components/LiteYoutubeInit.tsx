'use client'

import Script from 'next/script'

/**
 * lite-youtube-embed ライブラリを初期化するコンポーネント
 *
 * CSSは /src/styles/legacy/lite-yt-embed.css で読み込み済み
 * このコンポーネントはJSを読み込み、カスタム要素を登録する
 */
export function LiteYoutubeInit() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/lite-youtube-embed@0.3.2/src/lite-yt-embed.min.js"
      strategy="afterInteractive"
    />
  )
}
