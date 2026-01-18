#!/usr/bin/env python3
"""
Supabase Migration Script: Add content_type column to lab_articles

Usage:
  python run_migration.py

Requirements:
  pip install python-dotenv supabase
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables from parent directory
import pathlib
env_path = pathlib.Path(__file__).parent.parent / '.env.local'
if not env_path.exists():
    env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL:
    print("Error: Missing NEXT_PUBLIC_SUPABASE_URL in .env")
    sys.exit(1)
    
if not SUPABASE_SERVICE_KEY:
    print("Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase package not installed")
    print("Run: pip install supabase")
    sys.exit(1)

def main():
    print("=" * 60)
    print("Supabase Migration: Add content_type to lab_articles")
    print("=" * 60)
    
    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # First check if column exists by trying to select it
    print("\n1. Checking if content_type column exists...")
    
    try:
        response = supabase.table('lab_articles').select('id, slug, content_type').limit(5).execute()
        print("   ✓ content_type column already exists!")
        
        if response.data:
            print(f"   Found {len(response.data)} articles (showing first 5)")
            for article in response.data:
                content_type = article.get('content_type') or 'NULL'
                print(f"   - {article['slug']}: content_type = {content_type}")
                
            # Count by content_type
            all_articles = supabase.table('lab_articles').select('content_type').execute()
            type_counts = {}
            for a in all_articles.data:
                ct = a.get('content_type') or 'NULL'
                type_counts[ct] = type_counts.get(ct, 0) + 1
            
            print("\n   Content type distribution:")
            for ct, count in sorted(type_counts.items()):
                print(f"   - {ct}: {count} articles")
                
    except Exception as e:
        if 'does not exist' in str(e):
            print("   ✗ content_type column does NOT exist yet")
            print("\n2. Please run this SQL in Supabase Dashboard → SQL Editor:")
            print("-" * 60)
            
            sql = """
ALTER TABLE lab_articles
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_lab_articles_content_type 
ON lab_articles(content_type);

-- Set default content_type for existing articles
UPDATE lab_articles
SET content_type = 'knowledge'
WHERE content_type IS NULL;
"""
            print(sql)
            print("-" * 60)
            
            print("\n" + "=" * 60)
            print("Next Steps:")
            print("1. Go to Supabase Dashboard → SQL Editor")
            print("   https://supabase.com/dashboard/project/pjfrrgfdgakqdpfwygeb/sql")
            print("2. Copy and paste the SQL above")
            print("3. Click 'Run' to execute")
            print("4. Run this script again to verify")
            print("=" * 60)
        else:
            print(f"   Error: {e}")

if __name__ == '__main__':
    main()

