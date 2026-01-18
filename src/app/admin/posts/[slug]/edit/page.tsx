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
  
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/63159dbc-c164-4d44-a2c6-66bed569f591',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/edit/page.tsx:17',message:'generateMetadata start',data:{slug},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'B'})}).catch(()=>{})
  try {
    const fs = require('fs')
    fs.appendFileSync('/Users/takayukiishii/Downloads/PP_website/.cursor/debug.log', JSON.stringify({location:'posts/edit/page.tsx:17',message:'generateMetadata start (fs)',data:{slug},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'B'}) + '\n')
  } catch {}
  // #endregion

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

  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/63159dbc-c164-4d44-a2c6-66bed569f591',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/edit/page.tsx:30',message:'generateMetadata query result',data:{hasPost:!!post},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'B'})}).catch(()=>{})
  try {
    const fs = require('fs')
    fs.appendFileSync('/Users/takayukiishii/Downloads/PP_website/.cursor/debug.log', JSON.stringify({location:'posts/edit/page.tsx:30',message:'generateMetadata query result (fs)',data:{hasPost:!!post},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'B'}) + '\n')
  } catch {}
  // #endregion

  return {
    title: post ? `${post.title} を編集` : '記事を編集',
  }
}

async function getPost(slug: string) {
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/63159dbc-c164-4d44-a2c6-66bed569f591',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/edit/page.tsx:40',message:'getPost start',data:{slug},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'E'})}).catch(()=>{})
  try {
    const fs = require('fs')
    fs.appendFileSync('/Users/takayukiishii/Downloads/PP_website/.cursor/debug.log', JSON.stringify({location:'posts/edit/page.tsx:40',message:'getPost start (fs)',data:{slug},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'E'}) + '\n')
  } catch {}
  // #endregion

  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/63159dbc-c164-4d44-a2c6-66bed569f591',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/edit/page.tsx:46',message:'auth check',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'E'})}).catch(()=>{})
  try {
    const fs = require('fs')
    fs.appendFileSync('/Users/takayukiishii/Downloads/PP_website/.cursor/debug.log', JSON.stringify({location:'posts/edit/page.tsx:46',message:'auth check (fs)',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'E'}) + '\n')
  } catch {}
  // #endregion

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

  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/63159dbc-c164-4d44-a2c6-66bed569f591',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/edit/page.tsx:57',message:'getPost query result',data:{hasData:!!data,error:error?.message,isPublished:data?.is_published},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'E'})}).catch(()=>{})
  try {
    const fs = require('fs')
    fs.appendFileSync('/Users/takayukiishii/Downloads/PP_website/.cursor/debug.log', JSON.stringify({location:'posts/edit/page.tsx:57',message:'getPost query result (fs)',data:{hasData:!!data,error:error?.message,isPublished:data?.is_published},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'E'}) + '\n')
  } catch {}
  // #endregion

  if (error || !data) {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/63159dbc-c164-4d44-a2c6-66bed569f591',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'posts/edit/page.tsx:61',message:'getPost return null',data:{slug,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'E'})}).catch(()=>{})
    try {
      const fs = require('fs')
      fs.appendFileSync('/Users/takayukiishii/Downloads/PP_website/.cursor/debug.log', JSON.stringify({location:'posts/edit/page.tsx:61',message:'getPost return null (fs)',data:{slug,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'draft-404',hypothesisId:'E'}) + '\n')
    } catch {}
    // #endregion
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


