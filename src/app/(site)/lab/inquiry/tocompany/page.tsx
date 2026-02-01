import { Metadata } from 'next'
import Link from 'next/link'
import { InquiryFormWithTracking } from '@/components/InquiryFormWithTracking'
import { getAdConfig } from '@/lib/ads/server'

const PAGE_ID = 'lab_inquiry_tocompany'

export const metadata: Metadata = {
  title: '法人様向けお問い合わせ | PartnerLab',
  description: '法人様向けのPartnerPropサービスに関するお問い合わせはこちらから。パートナービジネスの成果拡大を支援するPRMツールについてご相談ください。',
  openGraph: {
    title: '法人様向けお問い合わせ | PartnerLab',
    description: '法人様向けのPartnerPropサービスに関するお問い合わせはこちらから。',
  },
}

export default async function ToCompanyInquiryPage() {
  const adConfig = await getAdConfig(PAGE_ID)

  return (
    <div className="min-h-screen bg-[var(--pp-bg-light)]">
      {/* ヘッダー */}
      <header className="bg-[var(--pp-dark)] py-12 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-400">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/lab" className="hover:text-white transition">
                  PartnerLab
                </Link>
              </li>
              <li>/</li>
              <li className="text-white">法人様向けお問い合わせ</li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            法人様向けお問い合わせ
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            法人様向けのPartnerPropサービスに関するお問い合わせを受け付けております。
          </p>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[var(--pp-dark)]">
              法人様向けサービス
            </h2>
            <p className="mt-2 text-gray-600">
              PartnerPropは、パートナービジネスの成果拡大を支援するPRMツールです。
              法人様向けに以下のサービスを提供しております。
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-[var(--pp-coral)]">•</span>
                <span>パートナー管理・可視化機能</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--pp-coral)]">•</span>
                <span>パートナーとのコミュニケーション支援</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--pp-coral)]">•</span>
                <span>パートナービジネスの分析・レポート機能</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--pp-coral)]">•</span>
                <span>導入支援・カスタマーサクセス</span>
              </li>
            </ul>
          </div>

          <div className="mb-8 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-[var(--pp-dark)]">
              お問い合わせフォーム
            </h2>
            <p className="mt-2 text-gray-600">
              サービスの詳細やお見積もりについて、お気軽にお問い合わせください。
              担当者より折り返しご連絡いたします。
            </p>
          </div>

          {/* HubSpotフォーム with 広告追跡 */}
          <InquiryFormWithTracking
            pageId={PAGE_ID}
            adConfig={adConfig}
            portalId="7315668"
            formId="tocompany-inquiry"
            className="hubspot-form-container"
          />

          {/* 連絡先情報 */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-[var(--pp-dark)]">
              その他のお問い合わせ
            </h3>
            <p className="mt-2 text-gray-600">
              製品デモやセミナーについては、以下よりお問い合わせください。
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/contact"
                className="inline-flex items-center text-[var(--pp-coral)] hover:underline"
              >
                総合お問い合わせフォームへ →
              </Link>
              <Link
                href="/seminar"
                className="inline-flex items-center text-[var(--pp-coral)] hover:underline"
              >
                セミナー一覧を見る →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* CTA */}
      <section className="bg-[var(--pp-dark)] py-12 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">
            PartnerLabの記事もご覧ください
          </h2>
          <p className="mt-4 text-gray-300">
            パートナービジネスに関する最新トレンドや成功事例をお届けしています。
          </p>
          <div className="mt-6">
            <Link
              href="/lab"
              className="inline-flex items-center rounded-lg bg-[var(--pp-coral)] px-6 py-3 font-medium text-white hover:bg-[var(--pp-coral-hover)] transition"
            >
              記事一覧を見る
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
