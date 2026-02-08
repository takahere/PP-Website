-- Migration: Add sections column to pages table
-- Date: 2025-01-06
-- Purpose: Support JSON-based section builder for LP pages

-- 1. Add sections column (JSONB for flexible JSON structure)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS sections JSONB;

-- 2. Add comment to document the column
COMMENT ON COLUMN pages.sections IS 'JSON array of LP sections for page builder mode. If null, content_html is used instead.';

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pages' AND column_name = 'sections';

















