import { Skeleton } from '@/components/ui/skeleton'

export default function MemberLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-slate-700 to-slate-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold">メンバー</h1>
          <p className="mt-4 text-lg text-slate-300">
            パートナービジネスの専門家チームがお客様の成長を支援します
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* 経営陣セクション */}
        <section className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">経営陣</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm">
                <Skeleton className="aspect-square w-full" />
                <div className="p-5 text-center">
                  <Skeleton className="mx-auto h-4 w-16 mb-2" />
                  <Skeleton className="mx-auto h-6 w-24" />
                  <Skeleton className="mx-auto h-4 w-20 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* メンバーセクション */}
        <section>
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">メンバー</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm">
                <Skeleton className="aspect-square w-full" />
                <div className="p-5 text-center">
                  <Skeleton className="mx-auto h-4 w-16 mb-2" />
                  <Skeleton className="mx-auto h-6 w-24" />
                  <Skeleton className="mx-auto h-4 w-20 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}















