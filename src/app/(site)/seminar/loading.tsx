export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダースケルトン */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-48 animate-pulse rounded bg-purple-400" />
          <div className="mt-4 h-6 w-96 animate-pulse rounded bg-purple-400" />
        </div>
      </div>

      {/* コンテンツスケルトン */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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







