'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/**
 * フローティングバナー（おすすめ資料3点セット）
 * 旧サイトと同じデザインで右下に表示
 */
export function FloatingBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // セッションストレージで閉じた状態を管理
    const dismissed = sessionStorage.getItem('floatingBannerDismissed')
    if (dismissed) {
      setIsDismissed(true)
      return
    }

    // 少し遅延してから表示（UX向上）
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setIsDismissed(true)
    sessionStorage.setItem('floatingBannerDismissed', 'true')
  }

  if (isDismissed || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fadeIn">
      <div className="relative bg-[#2d2d2d] rounded-lg shadow-2xl overflow-hidden max-w-[280px]">
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors z-10"
          aria-label="閉じる"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* タイトル */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-white text-sm font-bold leading-tight">
            パートナーマーケティング
            <br />
            <span className="text-[#FF746C]">おすすめ資料3点セット</span>
          </p>
        </div>

        {/* 資料プレビュー画像 */}
        <div className="px-4 pb-3">
          <div className="relative w-full aspect-[4/3] bg-gray-100 rounded overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/img_download02.png"
              alt="おすすめ資料3点セット"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* ダウンロードボタン */}
        <div className="px-4 pb-4">
          <Link
            href="/lab/inquiry/product"
            className="block w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-800 text-sm font-bold text-center rounded transition-colors"
          >
            無料でダウンロード
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
