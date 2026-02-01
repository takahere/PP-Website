import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface BusinessMetrics {
  // 新規Lab会員数（過去30日）
  newMembers: number
  newMembersTrend: number // 前期比 %
  
  // 公開記事数（過去30日）
  newArticles: number
  newArticlesTrend: number
  
  // セミナー数（過去30日に公開されたもの）
  newSeminars: number
  newSeminarsTrend: number
  
  // 導入事例数（過去30日）
  newCasestudies: number
  newCasestudiesTrend: number
  
  // 合計コンテンツ数
  totalLabArticles: number
  totalPosts: number
  totalPages: number
  totalMembers: number
}

export async function GET() {
  try {
    const supabase = await createClient()

    // 日付計算
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixtyDaysAgo = new Date(now)
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString()

    // 並列でデータ取得
    const [
      // 過去30日の新規メンバー
      recentMembersResult,
      // 30-60日前の新規メンバー（トレンド計算用）
      previousMembersResult,
      // 過去30日のLab記事
      recentLabResult,
      // 30-60日前のLab記事
      previousLabResult,
      // 過去30日のセミナー
      recentSeminarsResult,
      // 30-60日前のセミナー
      previousSeminarsResult,
      // 過去30日の導入事例
      recentCasestudiesResult,
      // 30-60日前の導入事例
      previousCasestudiesResult,
      // 合計数
      totalLabResult,
      totalPostsResult,
      totalPagesResult,
      totalMembersResult,
    ] = await Promise.all([
      // 新規メンバー（過去30日）
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgoStr),
      // 新規メンバー（30-60日前）
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgoStr)
        .lt('created_at', thirtyDaysAgoStr),
      // Lab記事（過去30日）
      supabase
        .from('lab_articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .gte('published_at', thirtyDaysAgoStr),
      // Lab記事（30-60日前）
      supabase
        .from('lab_articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .gte('published_at', sixtyDaysAgoStr)
        .lt('published_at', thirtyDaysAgoStr),
      // セミナー（過去30日）
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'seminar')
        .eq('is_published', true)
        .gte('published_at', thirtyDaysAgoStr),
      // セミナー（30-60日前）
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'seminar')
        .eq('is_published', true)
        .gte('published_at', sixtyDaysAgoStr)
        .lt('published_at', thirtyDaysAgoStr),
      // 導入事例（過去30日）
      supabase
        .from('pages')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'casestudy')
        .gte('published_at', thirtyDaysAgoStr),
      // 導入事例（30-60日前）
      supabase
        .from('pages')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'casestudy')
        .gte('published_at', sixtyDaysAgoStr)
        .lt('published_at', thirtyDaysAgoStr),
      // 合計: Lab記事
      supabase
        .from('lab_articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),
      // 合計: Posts
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),
      // 合計: Pages
      supabase
        .from('pages')
        .select('*', { count: 'exact', head: true }),
      // 合計: Members
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),
    ])

    // トレンド計算ヘルパー
    const calculateTrend = (recent: number, previous: number): number => {
      if (previous === 0) return recent > 0 ? 100 : 0
      return Math.round(((recent - previous) / previous) * 100)
    }

    const newMembers = recentMembersResult.count ?? 0
    const previousMembers = previousMembersResult.count ?? 0
    const newArticles = recentLabResult.count ?? 0
    const previousArticles = previousLabResult.count ?? 0
    const newSeminars = recentSeminarsResult.count ?? 0
    const previousSeminars = previousSeminarsResult.count ?? 0
    const newCasestudies = recentCasestudiesResult.count ?? 0
    const previousCasestudies = previousCasestudiesResult.count ?? 0

    const metrics: BusinessMetrics = {
      newMembers,
      newMembersTrend: calculateTrend(newMembers, previousMembers),
      newArticles,
      newArticlesTrend: calculateTrend(newArticles, previousArticles),
      newSeminars,
      newSeminarsTrend: calculateTrend(newSeminars, previousSeminars),
      newCasestudies,
      newCasestudiesTrend: calculateTrend(newCasestudies, previousCasestudies),
      totalLabArticles: totalLabResult.count ?? 0,
      totalPosts: totalPostsResult.count ?? 0,
      totalPages: totalPagesResult.count ?? 0,
      totalMembers: totalMembersResult.count ?? 0,
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Business metrics API error:', error)
    
    // エラー時はデモデータを返す
    return NextResponse.json({
      newMembers: 12,
      newMembersTrend: 20,
      newArticles: 5,
      newArticlesTrend: -10,
      newSeminars: 3,
      newSeminarsTrend: 50,
      newCasestudies: 2,
      newCasestudiesTrend: 0,
      totalLabArticles: 156,
      totalPosts: 45,
      totalPages: 32,
      totalMembers: 28,
      demo: true,
    })
  }
}















