export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダースケルトン */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded bg-indigo-400" />
            <div className="h-10 w-48 animate-pulse rounded bg-indigo-400" />
          </div>
          <div className="mt-4 h-6 w-96 animate-pulse rounded bg-indigo-400" />
        </div>
      </div>

      {/* カテゴリフィルタースケルトン */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 animate-pulse rounded-full bg-gray-200"
              />
            ))}
          </div>
        </div>
      </div>

      {/* コンテンツスケルトン */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl bg-white shadow-sm"
            >
              <div className="aspect-video animate-pulse bg-gray-200" />
              <div className="space-y-3 p-5">
                <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}







