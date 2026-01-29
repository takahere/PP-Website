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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface LabArticle {
  id: string
  slug: string
  title: string
  categories: string[] | null
  is_published: boolean
  published_at: string | null
  original_url: string | null
}

async function fixDuplicates() {
  console.log('🔧 Lab記事の重複修正開始...\n')

  // 全記事を取得
  const { data: articles, error } = await supabase
    .from('lab_articles')
    .select('id, slug, title, categories, is_published, published_at, original_url')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('❌ エラー:', error)
    return
  }

  console.log(`📊 総記事数: ${articles?.length || 0}\n`)

  // 同じタイトルの記事をグループ化
  const titleMap = new Map<string, LabArticle[]>()
  articles?.forEach(article => {
    const title = article.title.trim()
    if (!titleMap.has(title)) {
      titleMap.set(title, [])
    }
    titleMap.get(title)!.push(article)
  })

  const duplicateTitles = Array.from(titleMap.entries()).filter(([, articles]) => articles.length > 1)

  if (duplicateTitles.length === 0) {
    console.log('✅ 重複はありません\n')
    return
  }

  console.log(`⚠️  重複タイトル: ${duplicateTitles.length}組\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const toUnpublish: string[] = []
  const toKeep: string[] = []

  duplicateTitles.forEach(([title, articleList]) => {
    console.log(`📄 "${title}"`)
    console.log(`   重複数: ${articleList.length}件\n`)

    // 最も短いslugを持つ記事を残す（最もシンプルなURL）
    // 例: "agency_482" より "activation_482" の方が短い場合は activation_482 を優先
    const sortedArticles = [...articleList].sort((a, b) => a.slug.length - b.slug.length)
    
    const keepArticle = sortedArticles[0]
    const unpublishArticles = sortedArticles.slice(1)

    console.log(`   ✅ 残す: ${keepArticle.slug}`)
    console.log(`      カテゴリ: ${keepArticle.categories?.join(', ') || 'なし'}`)
    console.log(`      公開日: ${keepArticle.published_at}\n`)

    toKeep.push(keepArticle.slug)

    unpublishArticles.forEach(article => {
      console.log(`   ❌ 非公開にする: ${article.slug}`)
      console.log(`      カテゴリ: ${article.categories?.join(', ') || 'なし'}`)
      console.log(`      公開日: ${article.published_at}\n`)
      toUnpublish.push(article.id)
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  })

  console.log(`\n📊 サマリー:`)
  console.log(`   残す記事: ${toKeep.length}件`)
  console.log(`   非公開にする記事: ${toUnpublish.length}件\n`)

  // 確認プロンプト
  console.log('⚠️  上記の記事を非公開にしますか？ (実行する場合は DRY_RUN=false を設定)')
  
  const isDryRun = process.env.DRY_RUN !== 'false'
  
  if (isDryRun) {
    console.log('✨ ドライランモード: 実際の変更は行いません\n')
    console.log('実行するには: DRY_RUN=false npx tsx scripts/fix-lab-duplicates.ts\n')
    return
  }

  // 実際に非公開にする
  console.log('\n🔄 重複記事を非公開にしています...\n')

  let successCount = 0
  let errorCount = 0

  for (const articleId of toUnpublish) {
    try {
      const { error } = await supabase
        .from('lab_articles')
        .update({ is_published: false })
        .eq('id', articleId)

      if (error) {
        console.error(`   ❌ エラー: ${articleId} - ${error.message}`)
        errorCount++
      } else {
        console.log(`   ✅ 非公開にしました: ${articleId}`)
        successCount++
      }
    } catch (err) {
      console.error(`   ❌ エラー: ${articleId} - ${err}`)
      errorCount++
    }
  }

  console.log(`\n✨ 完了:`)
  console.log(`   成功: ${successCount}件`)
  console.log(`   失敗: ${errorCount}件\n`)
}

fixDuplicates()
  .then(() => {
    console.log('✅ 修正完了\n')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ エラーが発生しました:', err)
    process.exit(1)
  })














