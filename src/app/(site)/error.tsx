'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Site error:', error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6">
        {/* エラーアイコン */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-10 w-10 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* メッセージ */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            ページの読み込みに失敗しました
          </h1>
          <p className="text-gray-600">
            一時的な問題が発生している可能性があります。
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--pp-coral)] px-6 py-3 font-medium text-white transition hover:opacity-90"
          >
            再読み込み
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            トップページへ
          </Link>
        </div>

        {/* PartnerLabへのリンク */}
        <div className="pt-4">
          <Link
            href="/lab"
            className="text-[var(--pp-coral)] hover:underline"
          >
            PartnerLabの記事一覧を見る →
          </Link>
        </div>
      </div>
    </div>
  )
}















