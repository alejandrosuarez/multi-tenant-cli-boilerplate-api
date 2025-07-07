-- @version 1.0.0
-- @description Add image management tables for entity images with optimization support
-- @created_by Universal CLI
-- @generated_at 2025-07-07T16:45:00.000Z

-- Create entity images table
CREATE TABLE IF NOT EXISTS mtcli_entity_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    uploaded_by TEXT NOT NULL, -- User ID who uploaded
    original_name TEXT NOT NULL,
    label TEXT, -- Optional label like 'front_view', 'interior', etc.
    file_urls JSONB NOT NULL, -- Store URLs for different sizes
    file_size INTEGER, -- Original file size in bytes
    mime_type TEXT DEFAULT 'image/jpeg',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to entities table
    CONSTRAINT fk_entity_images_entity 
        FOREIGN KEY (entity_id) 
        REFERENCES mtcli_entities(id) 
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_images_entity_id ON mtcli_entity_images(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_images_tenant_id ON mtcli_entity_images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entity_images_uploaded_by ON mtcli_entity_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_entity_images_created_at ON mtcli_entity_images(created_at DESC);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_entity_images_entity_tenant 
    ON mtcli_entity_images(entity_id, tenant_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE mtcli_entity_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view images for entities in their tenant
CREATE POLICY "Users can view images in their tenant" ON mtcli_entity_images
    FOR SELECT USING (
        tenant_id = current_setting('app.current_tenant', true)
        OR tenant_id = 'default'
    );

-- Policy: Users can insert images for entities they own
CREATE POLICY "Users can upload images to their entities" ON mtcli_entity_images
    FOR INSERT WITH CHECK (
        uploaded_by = current_setting('app.current_user', true)
        AND tenant_id = current_setting('app.current_tenant', true)
    );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own images" ON mtcli_entity_images
    FOR DELETE USING (
        uploaded_by = current_setting('app.current_user', true)
        AND tenant_id = current_setting('app.current_tenant', true)
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_entity_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_entity_images_updated_at
    BEFORE UPDATE ON mtcli_entity_images
    FOR EACH ROW
    EXECUTE FUNCTION update_entity_images_updated_at();

-- Insert sample image record for testing
INSERT INTO mtcli_entity_images (
    entity_id,
    tenant_id,
    uploaded_by,
    original_name,
    label,
    file_urls,
    file_size,
    mime_type
) VALUES (
    (SELECT id FROM mtcli_entities LIMIT 1), -- Use existing entity
    'default',
    'dev-user',
    'sample_property.jpg',
    'main_view',
    '{
        "thumbnail": {
            "url": "https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=Thumbnail",
            "path": "default/sample/thumbnail.jpg",
            "size": 5120
        },
        "small": {
            "url": "https://via.placeholder.com/400x400/4A90E2/FFFFFF?text=Small",
            "path": "default/sample/small.jpg", 
            "size": 15360
        },
        "medium": {
            "url": "https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Medium",
            "path": "default/sample/medium.jpg",
            "size": 51200
        },
        "large": {
            "url": "https://via.placeholder.com/1200x900/4A90E2/FFFFFF?text=Large",
            "path": "default/sample/large.jpg",
            "size": 102400
        }
    }'::jsonb,
    204800,
    'image/jpeg'
) ON CONFLICT DO NOTHING;