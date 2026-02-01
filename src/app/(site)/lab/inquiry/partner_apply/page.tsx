import { Metadata } from 'next'
import Link from 'next/link'
import { InquiryFormWithTracking } from '@/components/InquiryFormWithTracking'
import { getAdConfig } from '@/lib/ads/server'

const PAGE_ID = 'lab_inquiry_partner_apply'

export const metadata: Metadata = {
  title: 'パートナー申請 | PartnerLab',
  description: 'PartnerPropのパートナープログラムへの申請はこちらから。ビジネスパートナーとして一緒にパートナービジネスを成長させませんか。',
  openGraph: {
    title: 'パートナー申請 | PartnerLab',
    description: 'PartnerPropのパートナープログラムへの申請はこちらから。',
  },
}

export default async function PartnerApplyPage() {
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
              <li className="text-white">パートナー申請</li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            パートナー申請
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            PartnerPropのパートナープログラムへのご参加をお待ちしております。
          </p>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          {/* パートナープログラムの説明 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[var(--pp-dark)]">
              パートナープログラムについて
            </h2>
            <p className="mt-2 text-gray-600">
              PartnerPropでは、ビジネスパートナー様と共にパートナービジネスの成長を支援しています。
              パートナープログラムに参加いただくことで、以下のメリットがあります。
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-[var(--pp-coral)]">•</span>
                <span>パートナービジネスに関する最新ノウハウの共有</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--pp-coral)]">•</span>
                <span>共同マーケティング・営業活動の支援</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--pp-coral)]">•</span>
                <span>専用サポート窓口のご提供</span>
              </li>
            </ul>
          </div>

          <div className="mb-8 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-[var(--pp-dark)]">
              申請フォーム
            </h2>
            <p className="mt-2 text-gray-600">
              下記フォームにご入力の上、送信ください。担当者より折り返しご連絡いたします。
            </p>
          </div>

          {/* HubSpotフォーム with 広告追跡 */}
          <InquiryFormWithTracking
            pageId={PAGE_ID}
            adConfig={adConfig}
            portalId="7315668"
            formId="partner-apply"
            className="hubspot-form-container"
          />

          {/* 連絡先情報 */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-[var(--pp-dark)]">
              その他のお問い合わせ
            </h3>
            <p className="mt-2 text-gray-600">
              パートナープログラムに関するご質問がある場合は、お気軽にお問い合わせください。
            </p>
            <div className="mt-4">
              <Link
                href="/contact"
                className="inline-flex items-center text-[var(--pp-coral)] hover:underline"
              >
                総合お問い合わせフォームへ →
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
