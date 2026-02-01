import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { SectionComponentProps } from '../../core/types'
import type { CTAContent } from './types'

/**
 * CTAセクション表示コンポーネント
 *
 * 注: 現在のCTASectionはハードコードされたコンテンツを表示しています。
 * CMSからのコンテンツ表示に対応する場合は、propsを使用するように変更してください。
 */
export function CTASection(_props: SectionComponentProps<CTAContent>) {
  // 現状は既存の静的コンテンツを表示
  // 将来的にはcontent, variantを使用してダイナミックに描画
  return (
    <section className="react-section py-16 sm:py-20 bg-zinc-800 text-white text-center">
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
            <Link href="/knowledge/demo/">無料デモを申し込む</Link>
          </Button>

          <Button
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-6 px-8 rounded-full"
            asChild
          >
            <Link href="/knowledge/service-form/">資料をダウンロードする</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
