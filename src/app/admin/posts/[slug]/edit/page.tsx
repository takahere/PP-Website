import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContentEditor, ContentData } from '@/components/admin/ContentEditor'
import { updatePost, deletePost } from './actions'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { title: '記事を編集' }
  }

  // 未公開記事も読み取れるようadminClientを使用
  const adminClient = createAdminClient()

  const { data: post } = await adminClient
    .from('posts')
    .select('title')
    .eq('slug', slug)
    .single()

  return {
    title: post ? `${post.title} を編集` : '記事を編集',
  }
}

async function getPost(slug: string) {
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // 管理画面なので未公開記事も読み取れるようadminClientを使用
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export default async function EditPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const initialData: ContentData = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content_html: post.content_html || '',
    thumbnail: post.thumbnail,
    seo_description: post.seo_description,
    og_description: post.og_description,
    is_published: post.is_published,
    type: post.type,
  }

  // プレビューURL
  const previewUrl =
    post.type === 'news' ? `/news/${post.slug}` : `/seminar/${post.slug}`

  // Server Actionsをラップ
  async function handleSave(data: ContentData) {
    'use server'
    return updatePost(data)
  }

  async function handleDelete() {
    'use server'
    return deletePost(slug)
  }

  return (
    <ContentEditor
      initialData={initialData}
      contentType="post"
      onSave={handleSave}
      onDelete={handleDelete}
      previewUrl={previewUrl}
    />
  )
}
