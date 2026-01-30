import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PostList } from '@/components/admin/PostList'
import { NewPostDialog } from '@/components/admin/NewPostDialog'

// 記事一覧を取得
async function getPosts() {
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  // 管理画面なので未公開記事も含めてすべて取得
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('posts')
    .select('id, slug, title, type, is_published, published_at, updated_at')
    .order('published_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return data || []
}

export default async function AdminPostsPage() {
  const posts = await getPosts()

  return (
    <div className="space-y-6">
      {/* 記事一覧（フィルター + 新規作成ボタン） */}
      <PostList
        posts={posts}
        headerActions={<NewPostDialog />}
      />
    </div>
  )
}
