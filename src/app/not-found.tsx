import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ページが見つかりません | PartnerProp',
  description: 'お探しのページは見つかりませんでした。URLが変更されたか、削除された可能性があります。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6">
        {/* 404アイコン */}
        <div className="text-8xl font-bold text-gray-200">404</div>
        
        {/* メッセージ */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            ページが見つかりません
          </h1>
          <p className="text-gray-600">
            お探しのページは移動または削除された可能性があります。
          </p>
        </div>

        {/* ナビゲーションリンク */}
        <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-white transition hover:bg-indigo-700"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            トップページへ
          </Link>
          <Link
            href="/lab"
            className="inline-flex items-center rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition hover:bg-gray-50"
          >
            PartnerLabを見る
          </Link>
        </div>

        {/* お問い合わせリンク */}
        <p className="pt-6 text-sm text-gray-500">
          お困りの場合は
          <Link href="/contact" className="text-indigo-600 hover:underline">
            お問い合わせ
          </Link>
          ください。
        </p>
      </div>
    </div>
  )
}














