import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface CTASectionProps {
  headline?: string
  description?: string
  button_text?: string
  button_link?: string
  variant?: 'simple' | 'gradient' | 'dark'
}

export function CTASection(_props: CTASectionProps = {}) {
  return (
    <section className="py-16 sm:py-20 bg-zinc-800 text-white text-center">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-3xl sm:text-4xl font-black mb-4">
          PartnerPropについて
          <br />
          さらに詳しく知りたい方はこちら
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mt-8 sm:mt-12">
          <Button
            variant="outline"
            size="lg"
            className="bg-white text-zinc-800 hover:bg-gray-100 border-2 font-bold py-6 px-8 rounded-full"
            asChild
          >
            <Link href="/knowledge/demo/">
              無料デモを申し込む
            </Link>
          </Button>

          <Button
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-6 px-8 rounded-full"
            asChild
          >
            <Link href="/knowledge/service-form/">
              資料をダウンロードする
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
