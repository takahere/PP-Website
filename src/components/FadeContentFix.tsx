'use client'

import { useEffect } from 'react'

/**
 * FadeContentFix - スクロールアニメーションをIntersection Observerで制御
 *
 * 旧サイトでは JavaScript でスクロール位置に応じて `.current` クラスを追加していた。
 * このコンポーネントは Intersection Observer を使用して同じ動作を再現する。
 *
 * 対象クラス:
 * - `.fadeContent` - フェードインアニメーション (opacity, translateY)
 * - `.scale` - スケールアニメーション
 * - `.line` - ラインアニメーション（#firstContent用）
 * - `.parts` - パーツアニメーション（段階的表示）
 */
export function FadeContentFix() {
  useEffect(() => {
    // Intersection Observer でスクロール検知
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement

            // .currentクラスを追加（CSSアニメーションをトリガー）
            el.classList.add('current')

            // 一度表示したら監視終了
            observer.unobserve(el)
          }
        })
      },
      {
        threshold: 0.15, // 15%見えたらトリガー
        rootMargin: '0px 0px -50px 0px', // 下から50px手前で発火
      }
    )

    // 対象要素を監視
    const observeTargets = () => {
      const targets = document.querySelectorAll(
        '.fadeContent:not(.current), .scale:not(.current), .line:not(.current), .parts:not(.current)'
      )
      targets.forEach((el) => observer.observe(el))
    }

    // 初回実行
    observeTargets()

    // MutationObserver で動的追加要素も監視
    const mutationObserver = new MutationObserver((mutations) => {
      let hasNewTargets = false

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // 追加されたノード自体をチェック
            if (
              node.matches &&
              node.matches(
                '.fadeContent:not(.current), .scale:not(.current), .line:not(.current), .parts:not(.current)'
              )
            ) {
              observer.observe(node)
              hasNewTargets = true
            }

            // 追加されたノードの子要素をチェック
            const newTargets = node.querySelectorAll(
              '.fadeContent:not(.current), .scale:not(.current), .line:not(.current), .parts:not(.current)'
            )
            if (newTargets.length > 0) {
              newTargets.forEach((el) => observer.observe(el))
              hasNewTargets = true
            }
          }
        })
      })

      // 新しいターゲットが見つかった場合、少し遅延して再チェック
      // （動的にレンダリングされるコンテンツ対応）
      if (hasNewTargets) {
        setTimeout(observeTargets, 100)
      }
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return null
}
