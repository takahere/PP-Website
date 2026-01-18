import Link from 'next/link'
import { ExternalLink, FileText, Folder, Tag, BookOpen, Newspaper, Calendar, Users, Briefcase, GraduationCap } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ListPageItem {
  name: string
  path: string
  description: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  type: 'posts' | 'pages' | 'lab'
}

interface CategoryItem {
  name: string
  slug: string
  count: number
}

interface TagItem {
  name: string
  slug: string
  count: number
}

async function getListPageData() {
  const supabase = await createClient()

  // Posts counts
  const { data: posts } = await supabase
    .from('posts')
    .select('type, is_published')
  
  const newsCount = posts?.filter(p => p.type === 'news' && p.is_published).length || 0
  const seminarCount = posts?.filter(p => p.type === 'seminar' && p.is_published).length || 0

  // Pages counts
  const { data: pages } = await supabase
    .from('pages')
    .select('type')
  
  const casestudyCount = pages?.filter(p => p.type === 'casestudy').length || 0
  const knowledgeCount = pages?.filter(p => p.type === 'knowledge').length || 0
  const memberCount = pages?.filter(p => p.type === 'member').length || 0

  // Lab articles
  const { data: labArticles } = await supabase
    .from('lab_articles')
    .select('categories, tags, content_type, is_published')
    .eq('is_published', true)

  const labCount = labArticles?.length || 0

  // カテゴリ別カウント
  const categoryMap = new Map<string, number>()
  labArticles?.forEach(article => {
    if (article.categories) {
      article.categories.forEach((cat: string) => {
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
      })
    }
  })

  // タグ別カウント
  const tagMap = new Map<string, number>()
  labArticles?.forEach(article => {
    if (article.tags) {
      article.tags.forEach((tag: string) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      })
    }
  })

  // コンテンツタイプ別カウント
  const contentTypeMap = new Map<string, number>()
  labArticles?.forEach(article => {
    if (article.content_type) {
      contentTypeMap.set(article.content_type, (contentTypeMap.get(article.content_type) || 0) + 1)
    }
  })

  // カテゴリマスター取得（名前とslugのマッピング用）
  const { data: categoriesMaster } = await supabase
    .from('lab_categories')
    .select('name, slug')
    .order('name')

  // カテゴリ名からslugへのマッピングを作成
  const categorySlugMap = new Map<string, string>()
  categoriesMaster?.forEach(cat => {
    const cleanName = cat.name.split(/[|｜│]/)[0]?.trim() || cat.name
    if (!categorySlugMap.has(cleanName)) {
      categorySlugMap.set(cleanName, cat.slug)
    }
  })

  // タグマスター取得
  const { data: tagsMaster } = await supabase
    .from('lab_tags')
    .select('name, slug')
    .order('name')

  // タグ名からslugへのマッピングを作成
  const tagSlugMap = new Map<string, string>()
  tagsMaster?.forEach(tag => {
    const cleanName = tag.name.split(/[|｜│]/)[0]?.trim() || tag.name
    if (!tagSlugMap.has(cleanName)) {
      tagSlugMap.set(cleanName, tag.slug)
    }
  })

  return {
    newsCount,
    seminarCount,
    casestudyCount,
    knowledgeCount,
    memberCount,
    labCount,
    categories: Array.from(categoryMap.entries())
      .map(([name, count]) => ({ 
        name, 
        count, 
        slug: categorySlugMap.get(name) || encodeURIComponent(name) 
      }))
      .sort((a, b) => b.count - a.count),
    tags: Array.from(tagMap.entries())
      .map(([name, count]) => ({ 
        name, 
        count,
        slug: tagSlugMap.get(name) || encodeURIComponent(name)
      }))
      .sort((a, b) => b.count - a.count),
    contentTypes: Array.from(contentTypeMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  }
}

function cleanCategoryName(name: string): string {
  const parts = name.split(/[|｜│]/)
  return parts[0]?.trim() || name
}

export default async function ListPagesPage() {
  const data = await getListPageData()

  const mainListPages: ListPageItem[] = [
    {
      name: 'News一覧',
      path: '/news',
      description: 'お知らせ・プレスリリース',
      count: data.newsCount,
      icon: Newspaper,
      type: 'posts',
    },
    {
      name: 'セミナー一覧',
      path: '/seminar',
      description: 'セミナー＆イベント情報',
      count: data.seminarCount,
      icon: Calendar,
      type: 'posts',
    },
    {
      name: '導入事例一覧',
      path: '/casestudy',
      description: 'お客様の導入事例',
      count: data.casestudyCount,
      icon: Briefcase,
      type: 'pages',
    },
    {
      name: 'お役立ち資料一覧',
      path: '/knowledge',
      description: 'ダウンロード資料',
      count: data.knowledgeCount,
      icon: GraduationCap,
      type: 'pages',
    },
    {
      name: 'メンバー一覧',
      path: '/member',
      description: 'チームメンバー紹介',
      count: data.memberCount,
      icon: Users,
      type: 'pages',
    },
    {
      name: 'Lab記事一覧',
      path: '/lab',
      description: 'PartnerLab記事',
      count: data.labCount,
      icon: BookOpen,
      type: 'lab',
    },
  ]

  const contentTypeLabels: Record<string, string> = {
    research: 'リサーチ',
    interview: 'インタビュー',
    knowledge: 'ナレッジ',
  }

  return (
    <div className="space-y-8">

      {/* メイン一覧ページ */}
      <section>
        <h2 className="text-lg font-semibold mb-4">メイン一覧ページ</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mainListPages.map((page) => (
            <Card key={page.path} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <page.icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{page.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{page.count}件</Badge>
                </div>
                <CardDescription>{page.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {page.path}
                  </code>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={page.path}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Labコンテンツタイプ */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Lab - コンテンツタイプ別</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {data.contentTypes.map((ct) => (
            <Card key={ct.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {contentTypeLabels[ct.name] || ct.name}
                  </CardTitle>
                  <Badge variant="secondary">{ct.count}件</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    /lab/content_type/{ct.name}
                  </code>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={`/lab/content_type/${ct.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Labカテゴリ */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Lab - カテゴリ別一覧
          <Badge variant="outline">{data.categories.length}カテゴリ</Badge>
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {data.categories.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {cat.count}件
                    </Badge>
                    <a
                      href={`/lab/category/${cat.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Labタグ */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Lab - タグ別一覧
          <Badge variant="outline">{data.tags.length}タグ</Badge>
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <a
                  key={tag.name}
                  href={`/lab/tag/${tag.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm"
                >
                  <span>#{tag.name}</span>
                  <Badge variant="secondary" className="text-xs ml-1">
                    {tag.count}
                  </Badge>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* パートナージャーニーカテゴリ */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Lab - パートナージャーニー</h2>
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { name: '戦略', slug: 'category_strategy-planning', description: '市場・顧客・競合を踏まえてパートナー戦略を設計' },
            { name: '開拓', slug: 'category_recruit', description: '戦略に沿ったパートナーセグメントで代理店契約を獲得' },
            { name: '育成', slug: 'category_training', description: 'リード共有や共同営業を通じて売上創出を推進' },
            { name: '稼働・継続', slug: 'category_activation', description: '初回の受注を実現し継続的な稼働につなげる' },
            { name: '仕組化', slug: 'category_optimization', description: '「売れる仕組み」を定着させる' },
          ].map((journey) => {
            const count = data.categories.find(c => c.name === journey.name)?.count || 0
            return (
              <Card key={journey.slug} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{journey.name}</CardTitle>
                    <Badge variant="secondary">{count}件</Badge>
                  </div>
                  <CardDescription className="text-xs line-clamp-2">
                    {journey.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a
                      href={`/lab/category/${journey.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      開く
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}

