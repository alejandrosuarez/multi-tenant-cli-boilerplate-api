-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- TENANTS & USERS (external via Clerk)
-- ================================
-- Clerk user IDs are stored as text (not FK)

-- ================================
-- ENTITIES
-- ================================
CREATE TABLE entities (
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
CREATE TABLE entity_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  base_schema JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- ATTRIBUTE REQUESTS
-- ================================
CREATE TABLE attribute_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES entities(id),
  attribute TEXT NOT NULL,
  user_id TEXT,
  visitor_token TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- INTERACTION LOGS
-- ================================
CREATE TABLE interaction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES entities(id),
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
CREATE TABLE notifications (
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
CREATE TABLE device_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_token TEXT NOT NULL,
  user_id TEXT NOT NULL,
  merged_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- ENTITY IMAGES
-- ================================
CREATE TABLE entity_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES entities(id),
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
CREATE INDEX idx_entities_tenant ON entities(tenant_id);
CREATE INDEX idx_attribute_requests_entity ON attribute_requests(entity_id);
CREATE INDEX idx_logs_entity ON interaction_logs(entity_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_entities_jsonb_attrs ON entities USING gin (attributes);
