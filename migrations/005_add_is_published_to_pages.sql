-- Migration: Add is_published column to pages table
-- This allows pages to be hidden from the public site while still being manageable in admin

-- Add is_published column with default true (existing pages remain published)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_pages_is_published ON pages(is_published);

-- Update RLS policy to only show published pages to public
-- First, drop the existing policy
DROP POLICY IF EXISTS "Allow public read access on pages" ON pages;

-- Create new policy that checks is_published
CREATE POLICY "Allow public read access on pages" ON pages
  FOR SELECT
  USING (is_published = true);

-- Add policy for authenticated users to see all pages (including unpublished)
CREATE POLICY "Allow authenticated read all pages" ON pages
  FOR SELECT
  USING (auth.role() = 'authenticated');
