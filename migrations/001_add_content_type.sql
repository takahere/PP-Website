-- Migration: Add content_type column to lab_articles table
-- Run this in Supabase SQL Editor

-- 1. Add content_type column
ALTER TABLE lab_articles
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- 2. Add comment to document the column
COMMENT ON COLUMN lab_articles.content_type IS 'Content type: research, interview, or knowledge';

-- 3. Create an index for faster filtering by content_type
CREATE INDEX IF NOT EXISTS idx_lab_articles_content_type 
ON lab_articles(content_type);

-- 4. (Optional) Add check constraint to ensure valid values
-- Uncomment if you want to enforce valid values at the database level
-- ALTER TABLE lab_articles
-- ADD CONSTRAINT check_content_type 
-- CHECK (content_type IS NULL OR content_type IN ('research', 'interview', 'knowledge'));

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lab_articles' AND column_name = 'content_type';














