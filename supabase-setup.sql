-- ================================
-- Multi-Tenant CLI Boilerplate Database Setup
-- Run this in Supabase Dashboard → SQL Editor
-- ================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- 1. ENTITY CATEGORIES TABLE
-- ================================
CREATE TABLE mtcli_entity_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 2. ENTITIES TABLE (with FK to categories)
-- ================================
CREATE TABLE mtcli_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 3. ATTRIBUTE REQUESTS TABLE
-- ================================
CREATE TABLE mtcli_attribute_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 4. INTERACTION LOGS TABLE
-- ================================
CREATE TABLE mtcli_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES mtcli_entities(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  user_id TEXT,
  visitor_token TEXT,
  event_payload JSONB DEFAULT '{}'::JSONB,
  tenant_context TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- 5. NOTIFICATIONS TABLE
-- ================================
CREATE TABLE mtcli_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 6. DEVICE LINKS TABLE
-- ================================
CREATE TABLE mtcli_device_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_token TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  merged_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- 7. ENTITY IMAGES TABLE
-- ================================
CREATE TABLE mtcli_entity_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 8. INDEXES FOR PERFORMANCE
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
-- 9. SAMPLE DATA
-- ================================
INSERT INTO mtcli_entity_categories (name, display_name, description, base_schema, tenant_id) VALUES
('vehicle', 'Vehicles', 'Cars, trucks, motorcycles, etc.', 
 '{"year": null, "make": null, "model": null, "price": null, "mileage": null, "color": null}', 'default'),
('property', 'Properties', 'Houses, apartments, commercial spaces', 
 '{"price": null, "bedrooms": null, "bathrooms": null, "sqft": null, "address": null}', 'default'),
('equipment', 'Equipment', 'Tools, machinery, electronics', 
 '{"brand": null, "model": null, "price": null, "condition": null, "year": null}', 'default');

-- ================================
-- 10. ROW LEVEL SECURITY POLICIES
-- ================================

-- Enable RLS on all tables
ALTER TABLE mtcli_entity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtcli_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtcli_attribute_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtcli_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtcli_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtcli_device_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtcli_entity_images ENABLE ROW LEVEL SECURITY;

-- Entity Categories: Tenant-scoped access
CREATE POLICY "Categories are tenant-scoped" ON mtcli_entity_categories
FOR ALL USING (
  tenant_id = current_setting('app.tenant_id', true) 
  OR current_setting('app.tenant_id', true) = 'global'
  OR current_setting('app.tenant_id', true) IS NULL
);

-- Entities: Public readable if shareable, otherwise tenant-scoped
CREATE POLICY "Entities are tenant-scoped or public" ON mtcli_entities
FOR SELECT USING (
  tenant_id = current_setting('app.tenant_id', true)
  OR public_shareable = true
  OR current_setting('app.tenant_id', true) = 'global'
  OR current_setting('app.tenant_id', true) IS NULL
);

CREATE POLICY "Entity modifications by owner" ON mtcli_entities
FOR ALL USING (
  owner_id = current_setting('app.user_id', true)
  OR current_setting('app.user_id', true) = 'admin'
) WITH CHECK (
  owner_id = current_setting('app.user_id', true)
  OR current_setting('app.user_id', true) = 'admin'
);

-- Allow service role to bypass RLS
CREATE POLICY "Service role bypass" ON mtcli_entities
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON mtcli_entity_categories
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON mtcli_interaction_logs
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON mtcli_attribute_requests
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON mtcli_notifications
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON mtcli_device_links
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass" ON mtcli_entity_images
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ================================
-- SUCCESS MESSAGE
-- ================================
DO $$
BEGIN
  RAISE NOTICE '🎉 Multi-Tenant CLI Boilerplate Database Setup Complete!';
  RAISE NOTICE '✅ Tables created with mtcli_ prefix';
  RAISE NOTICE '✅ Indexes and foreign keys configured';
  RAISE NOTICE '✅ Row Level Security policies enabled';
  RAISE NOTICE '✅ Sample categories inserted: vehicle, property, equipment';
  RAISE NOTICE '🚀 Ready to test entity APIs!';
END $$;