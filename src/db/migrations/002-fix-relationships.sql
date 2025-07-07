-- @version v1-alpha
-- @description Fix entity relationships and add missing fields
-- @created_by Universal CLI
-- @generated_at 2025-07-05T12:00:00Z

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- DROP EXISTING TABLES (if needed for clean setup)
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
-- ENTITY IMAGES
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
-- INDEXES & OPTIMIZATION
-- ================================
CREATE INDEX idx_mtcli_entities_tenant ON mtcli_entities(tenant_id);
CREATE INDEX idx_mtcli_entities_type ON mtcli_entities(entity_type);
CREATE INDEX idx_mtcli_entities_owner ON mtcli_entities(owner_id);
CREATE INDEX idx_mtcli_entities_share_token ON mtcli_entities(share_token);
CREATE INDEX idx_mtcli_entities_jsonb_attrs ON mtcli_entities USING gin (attributes);

CREATE INDEX idx_mtcli_categories_tenant ON mtcli_entity_categories(tenant_id);
CREATE INDEX idx_mtcli_categories_name ON mtcli_entity_categories(name);

CREATE INDEX idx_mtcli_attribute_requests_entity ON mtcli_attribute_requests(entity_id);
CREATE INDEX idx_mtcli_attribute_requests_status ON mtcli_attribute_requests(status);
CREATE INDEX idx_mtcli_attribute_requests_user ON mtcli_attribute_requests(user_id);

CREATE INDEX idx_mtcli_logs_entity ON mtcli_interaction_logs(entity_id);
CREATE INDEX idx_mtcli_logs_event_type ON mtcli_interaction_logs(event_type);
CREATE INDEX idx_mtcli_logs_tenant ON mtcli_interaction_logs(tenant_context);

CREATE INDEX idx_mtcli_notifications_user ON mtcli_notifications(user_id);
CREATE INDEX idx_mtcli_notifications_device ON mtcli_notifications(device_token);
CREATE INDEX idx_mtcli_notifications_seen ON mtcli_notifications(seen);

CREATE INDEX idx_mtcli_device_links_user ON mtcli_device_links(user_id);
CREATE INDEX idx_mtcli_device_links_device ON mtcli_device_links(device_token);

CREATE INDEX idx_mtcli_images_entity ON mtcli_entity_images(entity_id);
CREATE INDEX idx_mtcli_images_tenant ON mtcli_entity_images(tenant_id);

-- ================================
-- SAMPLE DATA
-- ================================
INSERT INTO mtcli_entity_categories (name, display_name, description, base_schema, tenant_id) VALUES
('vehicle', 'Vehicles', 'Cars, trucks, motorcycles, etc.', 
 '{"year": null, "make": null, "model": null, "price": null, "mileage": null, "color": null}', 'default'),
('property', 'Properties', 'Houses, apartments, commercial spaces', 
 '{"price": null, "bedrooms": null, "bathrooms": null, "sqft": null, "address": null}', 'default'),
('equipment', 'Equipment', 'Tools, machinery, electronics', 
 '{"brand": null, "model": null, "price": null, "condition": null, "year": null}', 'default');

-- ================================
-- FUNCTIONS FOR ATTRIBUTE SYNC
-- ================================
CREATE OR REPLACE FUNCTION sync_entity_attributes_with_category()
RETURNS TRIGGER AS $$
BEGIN
  -- When base_schema changes in categories, optionally sync existing entities
  -- This is a placeholder for future enhancement
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_attributes
  AFTER UPDATE OF base_schema ON mtcli_entity_categories
  FOR EACH ROW
  EXECUTE FUNCTION sync_entity_attributes_with_category();