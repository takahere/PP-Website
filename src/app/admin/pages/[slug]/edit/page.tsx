import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageEditor, PageEditorData } from '@/components/admin/PageEditor'
import { updatePage, deletePage } from './actions'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { title: 'ページを編集' }
  }

  // adminClientを使用
  const adminClient = createAdminClient()

  const { data: page } = await adminClient
    .from('pages')
    .select('title')
    .eq('slug', slug)
    .single()

  return {
    title: page ? `${page.title} を編集` : 'ページを編集',
  }
}

async function getPage(slug: string) {
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // 管理画面なのでadminClientを使用
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// プレビューURL生成
function getPreviewUrl(slug: string, type: string): string {
  switch (type) {
    case 'casestudy':
      return `/casestudy/${slug}`
    case 'knowledge':
      return `/knowledge/${slug}`
    default:
      return `/${slug}`
  }
}

export default async function EditPagePage({ params }: Props) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  const initialData: PageEditorData = {
    id: page.id,
    slug: page.slug,
    title: page.title,
    content_html: page.content_html || '',
    sections: page.sections || null,
    thumbnail: page.thumbnail,
    seo_description: page.seo_description,
    og_description: page.og_description,
    type: page.type,
    is_published: page.is_published ?? true,
  }

  const previewUrl = getPreviewUrl(page.slug, page.type)

  // Server Actionsをラップ
  async function handleSave(data: PageEditorData) {
    'use server'
    return updatePage(data)
  }

  async function handleDelete() {
    'use server'
    return deletePage(slug)
  }

  return (
    <PageEditor
      initialData={initialData}
      onSave={handleSave}
      onDelete={handleDelete}
      previewUrl={previewUrl}
    />
  )
}
