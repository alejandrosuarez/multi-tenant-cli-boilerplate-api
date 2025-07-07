-- ================================
-- SUPABASE DATABASE SETUP
-- Multi-Tenant CLI Boilerplate
-- ================================
-- Run this complete script in your Supabase SQL Editor
-- This will create all necessary tables, indexes, and sample data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- DROP EXISTING TABLES (Clean Setup)
-- ================================
DROP TABLE IF EXISTS mtcli_entity_images CASCADE;
DROP TABLE IF EXISTS mtcli_device_links CASCADE;
DROP TABLE IF EXISTS mtcli_notifications CASCADE;
DROP TABLE IF EXISTS mtcli_interaction_logs CASCADE;
DROP TABLE IF EXISTS mtcli_attribute_requests CASCADE;
DROP TABLE IF EXISTS mtcli_entities CASCADE;
DROP TABLE IF EXISTS mtcli_entity_categories CASCADE;

-- ================================
-- ENTITY CATEGORIES (MUST BE FIRST)
-- ================================
CREATE TABLE mtcli_entity_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  base_schema JSONB DEFAULT '{}'::JSONB,
  tenant_id TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- ENTITIES (WITH PROPER FOREIGN KEY)
-- ================================
CREATE TABLE mtcli_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL REFERENCES mtcli_entity_categories(name) ON DELETE RESTRICT,
  tenant_id TEXT NOT NULL,
  owner_id TEXT,
  attributes JSONB DEFAULT '{}'::JSONB,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  public_shareable BOOLEAN DEFAULT FALSE,
  disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- ATTRIBUTE REQUESTS
-- ================================
CREATE TABLE mtcli_attribute_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES mtcli_entities(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL,
  user_id TEXT,
  visitor_token TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  request_note TEXT,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- INTERACTION LOGS
-- ================================
CREATE TABLE mtcli_interaction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES mtcli_entities(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  user_id TEXT,
  visitor_token TEXT,
  event_payload JSONB DEFAULT '{}'::JSONB,
  tenant_context TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- NOTIFICATIONS
-- ================================
CREATE TABLE mtcli_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  device_token TEXT,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  event_payload JSONB DEFAULT '{}'::JSONB,
  tenant_context TEXT,
  seen BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- DEVICE MERGING
-- ================================
CREATE TABLE mtcli_device_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_token TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  merged_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- ENTITY IMAGES (Basic Structure)
-- ================================
CREATE TABLE mtcli_entity_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES mtcli_entities(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  label TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- ENHANCED ENTITY IMAGES (With Optimization Support)
-- ================================
-- Drop and recreate with enhanced structure
DROP TABLE IF EXISTS mtcli_entity_images CASCADE;

CREATE TABLE mtcli_entity_images (
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

-- ================================
-- INDEXES & OPTIMIZATION
-- ================================
-- Entity indexes
CREATE INDEX idx_mtcli_entities_tenant ON mtcli_entities(tenant_id);
CREATE INDEX idx_mtcli_entities_type ON mtcli_entities(entity_type);
CREATE INDEX idx_mtcli_entities_owner ON mtcli_entities(owner_id);
CREATE INDEX idx_mtcli_entities_share_token ON mtcli_entities(share_token);
CREATE INDEX idx_mtcli_entities_jsonb_attrs ON mtcli_entities USING gin (attributes);

-- Category indexes
CREATE INDEX idx_mtcli_categories_tenant ON mtcli_entity_categories(tenant_id);
CREATE INDEX idx_mtcli_categories_name ON mtcli_entity_categories(name);

-- Attribute request indexes
CREATE INDEX idx_mtcli_attribute_requests_entity ON mtcli_attribute_requests(entity_id);
CREATE INDEX idx_mtcli_attribute_requests_status ON mtcli_attribute_requests(status);
CREATE INDEX idx_mtcli_attribute_requests_user ON mtcli_attribute_requests(user_id);

-- Interaction log indexes
CREATE INDEX idx_mtcli_logs_entity ON mtcli_interaction_logs(entity_id);
CREATE INDEX idx_mtcli_logs_event_type ON mtcli_interaction_logs(event_type);
CREATE INDEX idx_mtcli_logs_tenant ON mtcli_interaction_logs(tenant_context);

-- Notification indexes
CREATE INDEX idx_mtcli_notifications_user ON mtcli_notifications(user_id);
CREATE INDEX idx_mtcli_notifications_device ON mtcli_notifications(device_token);
CREATE INDEX idx_mtcli_notifications_seen ON mtcli_notifications(seen);

-- Device link indexes
CREATE INDEX idx_mtcli_device_links_user ON mtcli_device_links(user_id);
CREATE INDEX idx_mtcli_device_links_device ON mtcli_device_links(device_token);

-- Image indexes
CREATE INDEX idx_entity_images_entity_id ON mtcli_entity_images(entity_id);
CREATE INDEX idx_entity_images_tenant_id ON mtcli_entity_images(tenant_id);
CREATE INDEX idx_entity_images_uploaded_by ON mtcli_entity_images(uploaded_by);
CREATE INDEX idx_entity_images_created_at ON mtcli_entity_images(created_at DESC);
CREATE INDEX idx_entity_images_entity_tenant ON mtcli_entity_images(entity_id, tenant_id);

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================
-- Enable RLS on images table
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

-- ================================
-- TRIGGERS & FUNCTIONS
-- ================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_entity_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on images
CREATE TRIGGER trigger_entity_images_updated_at
    BEFORE UPDATE ON mtcli_entity_images
    FOR EACH ROW
    EXECUTE FUNCTION update_entity_images_updated_at();

-- Function for attribute sync (placeholder for future enhancement)
CREATE OR REPLACE FUNCTION sync_entity_attributes_with_category()
RETURNS TRIGGER AS $$
BEGIN
  -- When base_schema changes in categories, optionally sync existing entities
  -- This is a placeholder for future enhancement
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for attribute sync
CREATE TRIGGER trigger_sync_attributes
  AFTER UPDATE OF base_schema ON mtcli_entity_categories
  FOR EACH ROW
  EXECUTE FUNCTION sync_entity_attributes_with_category();

-- ================================
-- SAMPLE DATA
-- ================================
-- Insert sample entity categories
INSERT INTO mtcli_entity_categories (name, display_name, description, base_schema, tenant_id) VALUES
('vehicle', 'Vehicles', 'Cars, trucks, motorcycles, etc.', 
 '{"year": null, "make": null, "model": null, "price": null, "mileage": null, "color": null}', 'default'),
('property', 'Properties', 'Houses, apartments, commercial spaces', 
 '{"price": null, "bedrooms": null, "bathrooms": null, "sqft": null, "address": null}', 'default'),
('equipment', 'Equipment', 'Tools, machinery, electronics', 
 '{"brand": null, "model": null, "price": null, "condition": null, "year": null}', 'default');

-- Insert sample entities
INSERT INTO mtcli_entities (entity_type, tenant_id, owner_id, attributes, public_shareable) VALUES
('vehicle', 'default', 'sample-user', 
 '{"year": "2020", "make": "Toyota", "model": "Camry", "price": "$25000", "mileage": "45000", "color": "Blue"}', true),
('property', 'default', 'sample-user', 
 '{"price": "$450000", "bedrooms": "3", "bathrooms": "2", "sqft": "1800", "address": "123 Main St"}', true),
('equipment', 'default', 'sample-user', 
 '{"brand": "DeWalt", "model": "DCD771C2", "price": "$199", "condition": "New", "year": "2023"}', false);

-- ================================
-- SETUP COMPLETE
-- ================================
-- Your database is now ready!
-- 
-- Next steps:
-- 1. Test your API endpoints
-- 2. Create entities via POST /api/entities
-- 3. Upload images via POST /api/entities/:id/images
-- 4. Set up authentication with your preferred provider
--
-- Available tables:
-- - mtcli_entity_categories (3 sample categories)
-- - mtcli_entities (3 sample entities)
-- - mtcli_attribute_requests
-- - mtcli_interaction_logs  
-- - mtcli_notifications
-- - mtcli_device_links
-- - mtcli_entity_images