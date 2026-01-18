#!/usr/bin/env python3
"""
WordPressから公開日を取得してデータベースを更新するスクリプト
"""

import os
import sys
import re
import time
import pathlib
from datetime import datetime
from typing import Optional, Dict
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# .envファイルを読み込み
env_path = pathlib.Path('.env.local')
if not env_path.exists():
    env_path = pathlib.Path('.env')
load_dotenv(env_path)

from supabase import create_client

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
WP_BASE_URL = 'https://partner-prop.com'


def parse_japanese_date(date_str: str) -> Optional[str]:
    """日本語の日付文字列をISO形式に変換"""
    if not date_str:
        return None
    
    # 空白を削除
    date_str = date_str.strip()
    
    # 「2023年3月28日」形式
    match = re.search(r'(\d{4})年(\d{1,2})月(\d{1,2})日', date_str)
    if match:
        year, month, day = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}T00:00:00+09:00"
    
    return None


def get_lab_article_date(slug: str) -> Optional[str]:
    """Lab記事の公開日を取得"""
    # slugからURLを生成 (例: optimization_950 -> /lab/optimization/950/)
    last_underscore = slug.rfind('_')
    if last_underscore != -1:
        category = slug[:last_underscore]
        id_part = slug[last_underscore + 1:]
        url = f"{WP_BASE_URL}/lab/{category}/{id_part}/"
    else:
        url = f"{WP_BASE_URL}/lab/{slug}/"
    
    try:
        res = requests.get(url, timeout=15)
        if res.status_code != 200:
            return None
        
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 日付テキストを探す
        date_patterns = soup.find_all(string=lambda text: text and ('年' in str(text) and '月' in str(text) and '日' in str(text)))
        for pattern in date_patterns:
            date = parse_japanese_date(str(pattern))
            if date:
                return date
        
        return None
    except Exception as e:
        print(f"    エラー: {e}")
        return None


def get_wp_api_posts() -> Dict[str, str]:
    """WordPress REST APIから投稿の公開日を取得"""
    dates = {}
    page = 1
    per_page = 100
    
    while True:
        try:
            url = f"{WP_BASE_URL}/wp-json/wp/v2/posts?per_page={per_page}&page={page}"
            res = requests.get(url, timeout=15)
            
            if res.status_code != 200:
                break
            
            posts = res.json()
            if not posts:
                break
            
            for post in posts:
                slug = post.get('slug')
                date = post.get('date')
                if slug and date:
                    # ISO形式に変換
                    dates[slug] = date
            
            page += 1
            time.sleep(0.5)
            
        except Exception as e:
            print(f"  API エラー: {e}")
            break
    
    return dates


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL or SUPABASE_KEY not found")
        sys.exit(1)
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("=" * 70)
    print("📅 公開日同期スクリプト")
    print("=" * 70)
    
    # 1. Lab記事の公開日を更新
    print("\n【1. Lab記事の公開日を更新】")
    lab_articles = supabase.table('lab_articles').select('slug, title, published_at').execute()
    lab_no_date = [a for a in lab_articles.data if not a.get('published_at')]
    print(f"  公開日未設定: {len(lab_no_date)}件")
    
    lab_updates = []
    for i, article in enumerate(lab_no_date):
        slug = article['slug']
        print(f"  [{i+1}/{len(lab_no_date)}] {slug}...", end=" ", flush=True)
        
        date = get_lab_article_date(slug)
        if date:
            lab_updates.append({'slug': slug, 'published_at': date})
            print(f"✓ {date[:10]}")
        else:
            print("✗ 取得失敗")
        
        time.sleep(0.3)  # レート制限
        
        # 10件ごとに進捗表示
        if (i + 1) % 10 == 0:
            print(f"    --- {i+1}件処理完了 ---")
    
    print(f"\n  取得成功: {len(lab_updates)}件")
    
    # 2. News/Seminarの公開日を更新（REST API使用）
    print("\n【2. News/Seminarの公開日を更新（REST API）】")
    wp_dates = get_wp_api_posts()
    print(f"  WordPress APIから取得: {len(wp_dates)}件")
    
    posts = supabase.table('posts').select('slug, title, type, published_at').execute()
    posts_no_date = [p for p in posts.data if not p.get('published_at')]
    
    post_updates = []
    for post in posts_no_date:
        slug = post['slug']
        if slug in wp_dates:
            post_updates.append({'slug': slug, 'published_at': wp_dates[slug]})
    
    print(f"  マッチ: {len(post_updates)}件")
    
    # 更新を適用
    print("\n" + "=" * 70)
    print(f"📝 更新対象")
    print(f"  Lab記事: {len(lab_updates)}件")
    print(f"  Posts: {len(post_updates)}件")
    print("=" * 70)
    
    if '--yes' not in sys.argv:
        confirm = input("\n更新を適用しますか？ (y/n): ").strip().lower()
        if confirm != 'y':
            print("キャンセルしました")
            return
    
    # Lab記事を更新
    if lab_updates:
        print("\nLab記事を更新中...")
        for update in lab_updates:
            supabase.table('lab_articles').update({
                'published_at': update['published_at']
            }).eq('slug', update['slug']).execute()
        print(f"  ✓ {len(lab_updates)}件更新完了")
    
    # Postsを更新
    if post_updates:
        print("\nPostsを更新中...")
        for update in post_updates:
            supabase.table('posts').update({
                'published_at': update['published_at']
            }).eq('slug', update['slug']).execute()
        print(f"  ✓ {len(post_updates)}件更新完了")
    
    print("\n" + "=" * 70)
    print("✅ 完了")
    print("=" * 70)


if __name__ == "__main__":
    main()

