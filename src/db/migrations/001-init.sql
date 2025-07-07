-- @version v1-alpha
-- @description Initializes core schema for entity, attributes, notifications
-- @created_by Universal CLI
-- @generated_at 2025-07-05T00:24:00Z

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- TENANTS & USERS (external via Clerk)
-- ================================
-- Clerk user IDs are stored as text (not FK)

-- ================================
-- ENTITIES
-- ================================
CREATE TABLE mtcli_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  owner_id TEXT,
  attributes JSONB DEFAULT '{}'::JSONB,
  disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- ENTITY CATEGORIES
-- ================================
CREATE TABLE mtcli_entity_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  base_schema JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- ATTRIBUTE REQUESTS
-- ================================
CREATE TABLE mtcli_attribute_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES mtcli_entities(id),
  attribute TEXT NOT NULL,
  user_id TEXT,
  visitor_token TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- INTERACTION LOGS
-- ================================
CREATE TABLE mtcli_interaction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES mtcli_entities(id),
  event_type TEXT NOT NULL,
  user_id TEXT,
  visitor_token TEXT,
  event_payload JSONB,
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
  message TEXT,
  link TEXT,
  event_payload JSONB,
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
  merged_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- ENTITY IMAGES
-- ================================
CREATE TABLE mtcli_entity_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES mtcli_entities(id),
  tenant_id TEXT,
  file_url TEXT NOT NULL,
  label TEXT,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- REMINDER TRACKING (Optional View)
-- ================================
-- Derived from notifications or request delta logic
-- Consider using a materialized view if needed

-- ================================
-- INDEXES & JSON Optimization
-- ================================
CREATE INDEX idx_mtcli_entities_tenant ON mtcli_entities(tenant_id);
CREATE INDEX idx_mtcli_attribute_requests_entity ON mtcli_attribute_requests(entity_id);
CREATE INDEX idx_mtcli_logs_entity ON mtcli_interaction_logs(entity_id);
CREATE INDEX idx_mtcli_notifications_user ON mtcli_notifications(user_id);
CREATE INDEX idx_mtcli_entities_jsonb_attrs ON mtcli_entities USING gin (attributes);
CREATE INDEX idx_mtcli_entities_type ON mtcli_entities(entity_type);
CREATE INDEX idx_mtcli_entities_owner ON mtcli_entities(owner_id);
CREATE INDEX idx_mtcli_notifications_device ON mtcli_notifications(device_token);
CREATE INDEX idx_mtcli_device_links_user ON mtcli_device_links(user_id);