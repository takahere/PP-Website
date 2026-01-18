#!/usr/bin/env python3
"""
Analyze lab_articles to help determine content_type patterns
"""

import os
import sys
import pathlib
from dotenv import load_dotenv

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent / '.env.local'
if not env_path.exists():
    env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from supabase import create_client, Client

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def main():
    print("=" * 70)
    print("Lab Articles Analysis for content_type Classification")
    print("=" * 70)
    
    # Fetch all articles
    response = supabase.table('lab_articles').select('id, slug, title, categories, tags').execute()
    articles = response.data
    
    print(f"\nTotal articles: {len(articles)}")
    
    # Keywords for classification
    interview_keywords = ['インタビュー', 'interview', '対談', '座談会', 'に聞く', 'が語る', '密着']
    research_keywords = ['リサーチ', 'research', '調査', 'データ', '分析', '統計', 'レポート', '実態', '動向']
    
    # Classify articles
    interview_articles = []
    research_articles = []
    knowledge_articles = []
    
    for article in articles:
        title = article['title'].lower() if article['title'] else ''
        categories = [c.lower() for c in (article['categories'] or [])]
        tags = [t.lower() for t in (article['tags'] or [])]
        all_text = title + ' ' + ' '.join(categories) + ' ' + ' '.join(tags)
        
        is_interview = any(kw.lower() in all_text for kw in interview_keywords)
        is_research = any(kw.lower() in all_text for kw in research_keywords)
        
        if is_interview:
            interview_articles.append(article)
        elif is_research:
            research_articles.append(article)
        else:
            knowledge_articles.append(article)
    
    print("\n" + "=" * 70)
    print(f"📗 INTERVIEW candidates ({len(interview_articles)} articles)")
    print("=" * 70)
    for a in interview_articles[:10]:
        print(f"  - {a['title'][:60]}...")
    if len(interview_articles) > 10:
        print(f"  ... and {len(interview_articles) - 10} more")
    
    print("\n" + "=" * 70)
    print(f"📊 RESEARCH candidates ({len(research_articles)} articles)")
    print("=" * 70)
    for a in research_articles[:10]:
        print(f"  - {a['title'][:60]}...")
    if len(research_articles) > 10:
        print(f"  ... and {len(research_articles) - 10} more")
    
    print("\n" + "=" * 70)
    print(f"📚 KNOWLEDGE (default) ({len(knowledge_articles)} articles)")
    print("=" * 70)
    for a in knowledge_articles[:10]:
        print(f"  - {a['title'][:60]}...")
    if len(knowledge_articles) > 10:
        print(f"  ... and {len(knowledge_articles) - 10} more")
    
    print("\n" + "=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"  Interview:  {len(interview_articles):3} articles")
    print(f"  Research:   {len(research_articles):3} articles")
    print(f"  Knowledge:  {len(knowledge_articles):3} articles")
    print(f"  Total:      {len(articles):3} articles")
    
    # Ask to apply
    print("\n" + "=" * 70)
    print("Apply these classifications? (y/n)")
    print("=" * 70)
    
    if '--yes' in sys.argv:
        print("> y (auto-confirmed with --yes flag)")
        apply_classifications(interview_articles, research_articles, knowledge_articles)
    else:
        try:
            confirm = input("> ").strip().lower()
            if confirm == 'y':
                apply_classifications(interview_articles, research_articles, knowledge_articles)
            else:
                print("Cancelled. No changes made.")
        except EOFError:
            print("\nTo apply automatically, run: python3 analyze_articles.py --yes")

def apply_classifications(interview_articles, research_articles, knowledge_articles):
    print("\nApplying classifications...")
    
    # Update interview articles
    if interview_articles:
        ids = [a['id'] for a in interview_articles]
        for article_id in ids:
            supabase.table('lab_articles').update({'content_type': 'interview'}).eq('id', article_id).execute()
        print(f"  ✓ Set {len(ids)} articles to 'interview'")
    
    # Update research articles
    if research_articles:
        ids = [a['id'] for a in research_articles]
        for article_id in ids:
            supabase.table('lab_articles').update({'content_type': 'research'}).eq('id', article_id).execute()
        print(f"  ✓ Set {len(ids)} articles to 'research'")
    
    # Update knowledge articles (already set, but just to be sure)
    if knowledge_articles:
        ids = [a['id'] for a in knowledge_articles]
        for article_id in ids:
            supabase.table('lab_articles').update({'content_type': 'knowledge'}).eq('id', article_id).execute()
        print(f"  ✓ Set {len(ids)} articles to 'knowledge'")
    
    print("\n✅ Classification complete!")
    
    # Verify
    response = supabase.table('lab_articles').select('content_type').execute()
    type_counts = {}
    for a in response.data:
        ct = a.get('content_type') or 'NULL'
        type_counts[ct] = type_counts.get(ct, 0) + 1
    
    print("\nFinal distribution:")
    for ct, count in sorted(type_counts.items()):
        print(f"  - {ct}: {count} articles")

if __name__ == '__main__':
    main()

