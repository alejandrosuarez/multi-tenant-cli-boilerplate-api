-- Migration: Add fallback support to mtcli_entity_images
-- This migration ensures the file_urls column exists and adds support for fallback flags

-- Ensure file_urls column exists (if it doesn't already)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'mtcli_entity_images' 
        AND column_name = 'file_urls'
    ) THEN
        ALTER TABLE mtcli_entity_images
        ADD COLUMN file_urls JSONB;
    END IF;
END $$;

-- Add comment to document the new structure
COMMENT ON COLUMN mtcli_entity_images.file_urls IS 'JSONB containing file URLs for different sizes. Can now include fallback:true flag for fallback images.';

-- Example of expected JSON structure:
-- {
--   "thumbnail": "https://...",
--   "small": "https://...",
--   "medium": "https://...",
--   "large": "https://...",
--   "original": "https://...",
--   "fallback": true  -- Optional flag to indicate this is a fallback image
-- }

-- Create index on file_urls for better query performance
CREATE INDEX IF NOT EXISTS idx_mtcli_entity_images_file_urls 
ON mtcli_entity_images USING GIN (file_urls);

-- Create index to quickly find fallback images
CREATE INDEX IF NOT EXISTS idx_mtcli_entity_images_fallback 
ON mtcli_entity_images USING GIN ((file_urls->'fallback'));

-- Migration completed
INSERT INTO mtcli_migrations (version, description, applied_at) 
VALUES ('006', 'Add fallback support to entity images', NOW())
ON CONFLICT (version) DO NOTHING;
