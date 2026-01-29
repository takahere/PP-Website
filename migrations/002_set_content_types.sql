-- Migration: Set content_type for existing articles
-- Run this after 001_add_content_type.sql

-- Option 1: Set default content_type for all existing articles without one
-- UPDATE lab_articles
-- SET content_type = 'knowledge'
-- WHERE content_type IS NULL;

-- Option 2: Set content_type based on existing categories or tags
-- Example: Articles with 'インタビュー' category/tag → 'interview'
UPDATE lab_articles
SET content_type = 'interview'
WHERE content_type IS NULL
AND (
  'インタビュー' = ANY(categories)
  OR 'インタビュー' = ANY(tags)
  OR 'interview' = ANY(ARRAY(SELECT LOWER(unnest(categories))))
  OR 'interview' = ANY(ARRAY(SELECT LOWER(unnest(tags))))
);

-- Example: Articles with 'リサーチ' or 'データ' or '調査' → 'research'
UPDATE lab_articles
SET content_type = 'research'
WHERE content_type IS NULL
AND (
  'リサーチ' = ANY(categories)
  OR 'リサーチ' = ANY(tags)
  OR 'データ' = ANY(categories)
  OR 'データ' = ANY(tags)
  OR '調査' = ANY(categories)
  OR '調査' = ANY(tags)
  OR 'research' = ANY(ARRAY(SELECT LOWER(unnest(categories))))
);

-- Set remaining articles to 'knowledge' (default)
UPDATE lab_articles
SET content_type = 'knowledge'
WHERE content_type IS NULL;

-- Verify the results
SELECT 
  content_type,
  COUNT(*) as article_count
FROM lab_articles
GROUP BY content_type
ORDER BY content_type;














