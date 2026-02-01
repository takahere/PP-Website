#!/usr/bin/env python3
"""
Sync content_type from WordPress site
Scrapes the WordPress content_type pages and updates the database accordingly
"""

import os
import re
import sys
import pathlib
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent / '.env.local'
if not env_path.exists():
    env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from supabase import create_client, Client

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: Missing Supabase credentials")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# WordPress content type pages
CONTENT_TYPE_URLS = {
    'research': 'https://partner-prop.com/lab/content_type/research/',
    'interview': 'https://partner-prop.com/lab/content_type/interview/',
    'knowledge': 'https://partner-prop.com/lab/content_type/knowledge/',
}

def extract_slug_from_url(url):
    """Extract slug from WordPress article URL like /lab/category/123/"""
    # URL format: /lab/category-name/123/
    match = re.search(r'/lab/([^/]+)/(\d+)/?$', url)
    if match:
        category = match.group(1)
        article_id = match.group(2)
        return f"{category}_{article_id}"
    return None

def get_articles_from_wp_page(url, content_type):
    """Scrape articles from a WordPress content_type page"""
    print(f"\n  Fetching: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    articles = []
    
    # Find all article links - look for links to /lab/category/id/ pattern
    for link in soup.find_all('a', href=True):
        href = link['href']
        if '/lab/' in href and re.search(r'/lab/[^/]+/\d+/?$', href):
            slug = extract_slug_from_url(href)
            if slug and slug not in [a['slug'] for a in articles]:
                # Try to get the title
                title = link.get_text(strip=True) or "Unknown"
                articles.append({
                    'slug': slug,
                    'url': href,
                    'title': title[:100],
                    'content_type': content_type
                })
    
    print(f"  Found {len(articles)} articles")
    return articles

def get_all_pages_for_content_type(base_url, content_type):
    """Get articles from all pages of a content type (handles pagination)"""
    all_articles = []
    page = 1
    
    while True:
        if page == 1:
            url = base_url
        else:
            url = f"{base_url}page/{page}/"
        
        print(f"  Checking page {page}...")
        
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 404:
                break
            response.raise_for_status()
        except Exception as e:
            print(f"  Page {page} not found or error: {e}")
            break
        
        soup = BeautifulSoup(response.text, 'html.parser')
        page_articles = []
        
        # Find all article links
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '/lab/' in href and re.search(r'/lab/[^/]+/\d+/?$', href):
                slug = extract_slug_from_url(href)
                if slug:
                    # Check if already in list
                    existing_slugs = [a['slug'] for a in all_articles]
                    if slug not in existing_slugs:
                        title = link.get_text(strip=True) or "Unknown"
                        if len(title) > 5:  # Filter out short non-title texts
                            page_articles.append({
                                'slug': slug,
                                'url': href,
                                'title': title[:100],
                                'content_type': content_type
                            })
        
        if not page_articles:
            break
            
        all_articles.extend(page_articles)
        print(f"  Found {len(page_articles)} articles on page {page}")
        page += 1
        
        if page > 10:  # Safety limit
            break
    
    return all_articles

def main():
    print("=" * 70)
    print("Sync content_type from WordPress")
    print("=" * 70)
    
    # Collect all articles from WordPress
    wp_articles = {}
    
    for content_type, url in CONTENT_TYPE_URLS.items():
        print(f"\n📂 Fetching {content_type.upper()} articles from WordPress...")
        articles = get_all_pages_for_content_type(url, content_type)
        for article in articles:
            wp_articles[article['slug']] = article
        print(f"   Total {content_type}: {len(articles)} articles")
    
    print("\n" + "=" * 70)
    print(f"Total articles from WordPress: {len(wp_articles)}")
    print("=" * 70)
    
    # Get current articles from database
    print("\n📊 Fetching current articles from database...")
    db_response = supabase.table('lab_articles').select('id, slug, title, content_type').execute()
    db_articles = {a['slug']: a for a in db_response.data}
    print(f"   Total in database: {len(db_articles)}")
    
    # Compare and prepare updates
    updates = []
    missing_in_db = []
    not_in_wp = []
    
    for slug, wp_article in wp_articles.items():
        if slug in db_articles:
            db_article = db_articles[slug]
            if db_article['content_type'] != wp_article['content_type']:
                updates.append({
                    'id': db_article['id'],
                    'slug': slug,
                    'old_type': db_article['content_type'],
                    'new_type': wp_article['content_type'],
                    'title': db_article['title'][:50]
                })
        else:
            missing_in_db.append(wp_article)
    
    for slug, db_article in db_articles.items():
        if slug not in wp_articles:
            not_in_wp.append(db_article)
    
    # Report
    print("\n" + "=" * 70)
    print("Analysis Results")
    print("=" * 70)
    
    print(f"\n🔄 Articles to UPDATE content_type: {len(updates)}")
    for u in updates[:20]:
        print(f"   - {u['title'][:40]}... : {u['old_type']} → {u['new_type']}")
    if len(updates) > 20:
        print(f"   ... and {len(updates) - 20} more")
    
    print(f"\n❌ Articles in WordPress but NOT in database: {len(missing_in_db)}")
    for m in missing_in_db[:10]:
        print(f"   - {m['slug']}: {m['title'][:40]}...")
    if len(missing_in_db) > 10:
        print(f"   ... and {len(missing_in_db) - 10} more")
    
    print(f"\n⚠️  Articles in database but NOT in WordPress content_type pages: {len(not_in_wp)}")
    for n in not_in_wp[:10]:
        print(f"   - {n['slug']}: {n['title'][:40] if n['title'] else 'No title'}...")
    if len(not_in_wp) > 10:
        print(f"   ... and {len(not_in_wp) - 10} more")
    
    # Summary by content_type
    print("\n" + "=" * 70)
    print("WordPress content_type distribution:")
    print("=" * 70)
    type_counts = {}
    for article in wp_articles.values():
        ct = article['content_type']
        type_counts[ct] = type_counts.get(ct, 0) + 1
    for ct, count in sorted(type_counts.items()):
        print(f"   - {ct}: {count} articles")
    
    # Apply updates
    if updates and ('--yes' in sys.argv or input("\nApply updates? (y/n): ").strip().lower() == 'y'):
        print("\n🔄 Applying updates...")
        for u in updates:
            supabase.table('lab_articles').update({
                'content_type': u['new_type']
            }).eq('id', u['id']).execute()
        print(f"   ✓ Updated {len(updates)} articles")
        
        # Verify
        response = supabase.table('lab_articles').select('content_type').execute()
        final_counts = {}
        for a in response.data:
            ct = a.get('content_type') or 'NULL'
            final_counts[ct] = final_counts.get(ct, 0) + 1
        
        print("\n📊 Final database distribution:")
        for ct, count in sorted(final_counts.items()):
            print(f"   - {ct}: {count} articles")
    else:
        print("\nNo updates applied.")

if __name__ == '__main__':
    main()















