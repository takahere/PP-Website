import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'home')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    hasPage: !!page,
    hasSections: !!(page?.sections && Array.isArray(page.sections) && page.sections.length > 0),
    sectionsCount: Array.isArray(page?.sections) ? page.sections.length : 0,
    hasContentHtml: !!(page?.content_html && typeof page.content_html === 'string' && page.content_html.trim().length > 0),
    contentHtmlLength: page?.content_html?.length || 0,
    contentHtmlPreview: page?.content_html?.substring(0, 500) || null,
    pageFields: page ? Object.keys(page) : [],
  })
}
