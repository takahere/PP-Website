import { Metadata } from 'next'
import Link from 'next/link'
import { HubSpotForm } from '@/components/HubSpotForm'

export const metadata: Metadata = {
  title: '広報・PRに関するお問い合わせ | PartnerLab',
  description: 'PartnerPropへの取材依頼、プレスリリース、広報・PRに関するお問い合わせはこちらから。',
  openGraph: {
    title: '広報・PRに関するお問い合わせ | PartnerLab',
    description: 'PartnerPropへの取材依頼、プレスリリース、広報・PRに関するお問い合わせはこちらから。',
  },
}

export default function PRInquiryPage() {
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
              <li className="text-white">広報・PRに関するお問い合わせ</li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            広報・PRに関するお問い合わせ
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            取材依頼、プレスリリース、広報に関するお問い合わせを受け付けております。
          </p>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[var(--pp-dark)]">
              お問い合わせ内容
            </h2>
            <p className="mt-2 text-gray-600">
              以下のようなお問い合わせを受け付けております。
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-[var(--pp-coral)]">•</span>
                <span>取材・インタビュー依頼</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--pp-coral)]">•</span>
                <span>プレスリリースに関するお問い合わせ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--pp-coral)]">•</span>
                <span>メディア掲載に関するご相談</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--pp-coral)]">•</span>
                <span>その他広報・PRに関するお問い合わせ</span>
              </li>
            </ul>
          </div>

          <div className="mb-8 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-[var(--pp-dark)]">
              お問い合わせフォーム
            </h2>
            <p className="mt-2 text-gray-600">
              下記フォームにご入力の上、送信ください。担当者より折り返しご連絡いたします。
            </p>
          </div>

          {/* HubSpotフォーム */}
          <HubSpotForm
            portalId="7315668"
            formId="pr-inquiry"
            className="hubspot-form-container"
          />

          {/* 連絡先情報 */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-[var(--pp-dark)]">
              その他のお問い合わせ
            </h3>
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
