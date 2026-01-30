'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// バージョン履歴テーブルがない場合のフォールバック用
// 実際のテーブル作成SQL:
/*
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL, -- 'post', 'page', 'lab_article'
  content_id UUID NOT NULL,
  content_slug VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  content_html TEXT,
  thumbnail TEXT,
  seo_description TEXT,
  og_description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_versions_lookup ON content_versions(content_type, content_slug);
CREATE INDEX idx_content_versions_created ON content_versions(created_at DESC);
*/

interface VersionData {
  content_type: 'post' | 'page' | 'lab_article'
  content_id?: string
  content_slug: string
  title: string
  content_html?: string
  thumbnail?: string | null
  seo_description?: string | null
  og_description?: string | null
  metadata?: Record<string, unknown>
}

// バージョン一覧を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('content_type')
    const contentSlug = searchParams.get('content_slug')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!contentType || !contentSlug) {
      return NextResponse.json(
        { error: 'content_type と content_slug は必須です' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: versions, error } = await adminClient
      .from('content_versions')
      .select('id, title, created_at, created_by')
      .eq('content_type', contentType)
      .eq('content_slug', contentSlug)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      // テーブルが存在しない場合は空配列を返す
      if (error.code === '42P01') {
        return NextResponse.json({ versions: [], error: 'テーブルが存在しません。管理者に連絡してください。' })
      }
      console.error('Error fetching versions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ versions: versions || [] })
  } catch (err) {
    console.error('Error in GET versions:', err)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 新しいバージョンを作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body: VersionData = await request.json()

    if (!body.content_type || !body.content_slug || !body.title) {
      return NextResponse.json(
        { error: 'content_type, content_slug, title は必須です' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: version, error } = await adminClient
      .from('content_versions')
      .insert({
        content_type: body.content_type,
        content_id: body.content_id,
        content_slug: body.content_slug,
        title: body.title,
        content_html: body.content_html,
        thumbnail: body.thumbnail,
        seo_description: body.seo_description,
        og_description: body.og_description,
        metadata: body.metadata || {},
        created_by: user.id,
      })
      .select('id, created_at')
      .single()

    if (error) {
      // テーブルが存在しない場合
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'バージョン履歴テーブルが存在しません。管理者に連絡してください。', warning: true },
          { status: 200 }
        )
      }
      console.error('Error creating version:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ version })
  } catch (err) {
    console.error('Error in POST version:', err)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
