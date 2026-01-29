import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// .env.local から環境変数を読み込む
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const envFile = readFileSync(envPath, 'utf-8')
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        process.env[key] = value
      }
    })
  } catch (error) {
    console.error('⚠️  .env.local の読み込みに失敗しました')
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface LabArticle {
  id: string
  slug: string
  title: string
  categories: string[] | null
  tags: string[] | null
  is_published: boolean
  original_url: string | null
}

interface ArticleSummary {
  slug: string
  is_published: boolean
}

interface DuplicateIssue {
  type: string
  slug?: string
  title?: string
  categories?: string[]
  tags?: string[]
  duplicates?: string[]
  articles?: ArticleSummary[]
  count?: number
}

async function checkDuplicates() {
  console.log('🔍 Lab記事の重複チェック開始...\n')

  // 全記事を取得
  const { data: articles, error } = await supabase
    .from('lab_articles')
    .select('id, slug, title, categories, tags, is_published, original_url')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('❌ エラー:', error)
    return { articles: [], issues: [] }
  }

  console.log(`📊 総記事数: ${articles?.length || 0}\n`)

  const issues: DuplicateIssue[] = []

  // 1. カテゴリ配列内の重複をチェック
  const articlesWithDuplicateCategories = articles?.filter(article => {
    const cats = article.categories || []
    const uniqueCats = new Set(cats)
    return cats.length !== uniqueCats.size
  })

  if (articlesWithDuplicateCategories && articlesWithDuplicateCategories.length > 0) {
    console.log(`⚠️  カテゴリ配列内に重複がある記事: ${articlesWithDuplicateCategories.length}件\n`)
    articlesWithDuplicateCategories.forEach(article => {
      const cats = article.categories || []
      const duplicates = cats.filter((cat: string, index: number) => cats.indexOf(cat) !== index)
      console.log(`  📄 ${article.title}`)
      console.log(`     Slug: ${article.slug}`)
      console.log(`     カテゴリ: [${cats.join(', ')}]`)
      console.log(`     重複: [${duplicates.join(', ')}]\n`)
      
      issues.push({
        type: 'duplicate_categories',
        slug: article.slug,
        title: article.title,
        categories: cats,
        duplicates
      })
    })
  } else {
    console.log('✅ カテゴリ配列内の重複はありません\n')
  }

  // 2. タグ配列内の重複をチェック
  const articlesWithDuplicateTags = articles?.filter(article => {
    const tags = article.tags || []
    const uniqueTags = new Set(tags)
    return tags.length !== uniqueTags.size
  })

  if (articlesWithDuplicateTags && articlesWithDuplicateTags.length > 0) {
    console.log(`⚠️  タグ配列内に重複がある記事: ${articlesWithDuplicateTags.length}件\n`)
    articlesWithDuplicateTags.forEach(article => {
      const tags = article.tags || []
      const duplicates = tags.filter((tag: string, index: number) => tags.indexOf(tag) !== index)
      console.log(`  📄 ${article.title}`)
      console.log(`     タグ: [${tags.join(', ')}]`)
      console.log(`     重複: [${duplicates.join(', ')}]\n`)
      
      issues.push({
        type: 'duplicate_tags',
        slug: article.slug,
        title: article.title,
        tags,
        duplicates
      })
    })
  } else {
    console.log('✅ タグ配列内の重複はありません\n')
  }

  // 3. 同じタイトルの記事をチェック
  const titleMap = new Map<string, LabArticle[]>()
  articles?.forEach(article => {
    const title = article.title.trim()
    if (!titleMap.has(title)) {
      titleMap.set(title, [])
    }
    titleMap.get(title)!.push(article)
  })

  const duplicateTitles = Array.from(titleMap.entries()).filter(([, articles]) => articles.length > 1)
  
  if (duplicateTitles.length > 0) {
    console.log(`⚠️  同じタイトルの記事: ${duplicateTitles.length}組\n`)
    duplicateTitles.forEach(([title, articleList]) => {
      console.log(`  📄 "${title}"`)
      articleList.forEach(a => {
        console.log(`     - Slug: ${a.slug} (公開: ${a.is_published ? 'はい' : 'いいえ'})`)
      })
      console.log()
      
      issues.push({
        type: 'duplicate_titles',
        title,
        articles: articleList.map(a => ({ slug: a.slug, is_published: a.is_published }))
      })
    })
  } else {
    console.log('✅ タイトルの重複はありません\n')
  }

  // 4. Slug重複チェック（理論上は起きないはず）
  const slugMap = new Map<string, number>()
  articles?.forEach(article => {
    const count = slugMap.get(article.slug) || 0
    slugMap.set(article.slug, count + 1)
  })

  const duplicateSlugs = Array.from(slugMap.entries()).filter(([, count]) => count > 1)
  
  if (duplicateSlugs.length > 0) {
    console.log(`🚨 Slug重複（データベース制約違反の可能性）: ${duplicateSlugs.length}件\n`)
    duplicateSlugs.forEach(([slug, count]) => {
      console.log(`  ⚠️  Slug: ${slug} (${count}件)\n`)
      issues.push({
        type: 'duplicate_slugs',
        slug,
        count
      })
    })
  } else {
    console.log('✅ Slugの重複はありません\n')
  }

  // 5. リダイレクト確認
  const articlesWithOriginalUrl = articles?.filter(a => a.original_url) || []
  console.log(`📋 original_urlが設定されている記事: ${articlesWithOriginalUrl.length}件`)
  
  if (articlesWithOriginalUrl.length > 0) {
    const { data: redirects } = await supabase
      .from('redirects')
      .select('from_path, to_path')

    const redirectMap = new Map(redirects?.map(r => [r.to_path, r.from_path]) || [])
    
    const missingRedirects = articlesWithOriginalUrl.filter(article => {
      const newUrl = buildLabArticleUrl(article.slug)
      return !redirectMap.has(newUrl)
    })

    if (missingRedirects.length > 0) {
      console.log(`⚠️  リダイレクトが未設定の記事: ${missingRedirects.length}件\n`)
      missingRedirects.slice(0, 5).forEach(article => {
        console.log(`  📄 ${article.title}`)
        console.log(`     元URL: ${article.original_url}`)
        console.log(`     新URL: ${buildLabArticleUrl(article.slug)}\n`)
      })
      if (missingRedirects.length > 5) {
        console.log(`     ... 他 ${missingRedirects.length - 5}件\n`)
      }
    } else {
      console.log('✅ すべての記事にリダイレクトが設定されています\n')
    }
  }

  return { articles: articles || [], issues }
}

function buildLabArticleUrl(slug: string): string {
  const lastUnderscoreIndex = slug.lastIndexOf('_')
  if (lastUnderscoreIndex !== -1) {
    const category = slug.substring(0, lastUnderscoreIndex)
    const id = slug.substring(lastUnderscoreIndex + 1)
    return `/lab/${category}/${id}`
  }
  return `/lab/${slug}`
}

// 実行
checkDuplicates()
  .then(({ issues }) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✨ チェック完了')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (issues.length > 0) {
      console.log(`\n⚠️  合計 ${issues.length} 件の問題が見つかりました`)
      console.log('   修正が必要です\n')
      process.exit(1)
    } else {
      console.log('\n✅ 問題は見つかりませんでした\n')
      process.exit(0)
    }
  })
  .catch(err => {
    console.error('❌ エラーが発生しました:', err)
    process.exit(1)
  })

