-- @version v1.1.0
-- @description Add push_subscriptions table for OneSignal integration
-- @created_by Universal CLI
-- @generated_at 2025-07-09T17:52:00Z

-- ================================
-- PUSH SUBSCRIPTIONS TABLE
-- ================================
-- This table stores device push subscription information
-- separate from the notifications table for better organization
CREATE TABLE mtcli_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_token TEXT NOT NULL,
  user_id TEXT, -- Clerk user ID, null for anonymous visitors
  tenant_context TEXT NOT NULL,
  subscription_data JSONB DEFAULT '{}'::JSONB, -- Store OneSignal player_id and other metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- NOTIFICATION PREFERENCES TABLE
-- ================================
-- This table stores user notification preferences
CREATE TABLE mtcli_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Clerk user ID
  tenant_context TEXT NOT NULL,
  preferences JSONB DEFAULT '{
    "chat_requests": true,
    "attribute_updates": true,
    "reminders": true,
    "marketing": false
  }'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================
CREATE INDEX idx_mtcli_push_subscriptions_device_token ON mtcli_push_subscriptions(device_token);
CREATE INDEX idx_mtcli_push_subscriptions_user_id ON mtcli_push_subscriptions(user_id);
CREATE INDEX idx_mtcli_push_subscriptions_tenant ON mtcli_push_subscriptions(tenant_context);
CREATE INDEX idx_mtcli_push_subscriptions_active ON mtcli_push_subscriptions(is_active);

CREATE INDEX idx_mtcli_notification_preferences_user_id ON mtcli_notification_preferences(user_id);
CREATE INDEX idx_mtcli_notification_preferences_tenant ON mtcli_notification_preferences(tenant_context);

-- ================================
-- UNIQUE CONSTRAINTS
-- ================================
-- Ensure one subscription per device token per tenant
CREATE UNIQUE INDEX idx_mtcli_push_subscriptions_device_tenant 
  ON mtcli_push_subscriptions(device_token, tenant_context);

-- Ensure one preference record per user per tenant
CREATE UNIQUE INDEX idx_mtcli_notification_preferences_user_tenant 
  ON mtcli_notification_preferences(user_id, tenant_context);

-- ================================
-- FUNCTIONS FOR UPDATED_AT
-- ================================
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- TRIGGERS FOR UPDATED_AT
-- ================================
CREATE TRIGGER trigger_push_subscriptions_updated_at
  BEFORE UPDATE ON mtcli_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

CREATE TRIGGER trigger_notification_preferences_updated_at
  BEFORE UPDATE ON mtcli_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ================================
-- HELPER FUNCTIONS
-- ================================
-- Function to merge device subscriptions when user logs in
CREATE OR REPLACE FUNCTION merge_device_subscription(
  p_device_token TEXT,
  p_user_id TEXT,
  p_tenant_context TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  subscription_exists BOOLEAN;
BEGIN
  -- Check if subscription exists
  SELECT EXISTS(
    SELECT 1 FROM mtcli_push_subscriptions 
    WHERE device_token = p_device_token 
    AND tenant_context = p_tenant_context
  ) INTO subscription_exists;

  IF subscription_exists THEN
    -- Update existing subscription with user_id
    UPDATE mtcli_push_subscriptions 
    SET user_id = p_user_id, 
        updated_at = now(),
        last_used_at = now()
    WHERE device_token = p_device_token 
    AND tenant_context = p_tenant_context;
    
    RETURN TRUE;
  ELSE
    -- Create new subscription
    INSERT INTO mtcli_push_subscriptions (device_token, user_id, tenant_context)
    VALUES (p_device_token, p_user_id, p_tenant_context);
    
    RETURN TRUE;
  END IF;
  
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get active subscriptions for a user
CREATE OR REPLACE FUNCTION get_user_subscriptions(
  p_user_id TEXT,
  p_tenant_context TEXT
) RETURNS TABLE (
  device_token TEXT,
  subscription_data JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.device_token,
    s.subscription_data,
    s.created_at
  FROM mtcli_push_subscriptions s
  WHERE s.user_id = p_user_id 
  AND s.tenant_context = p_tenant_context
  AND s.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- SAMPLE DATA (for testing)
-- ================================
-- Insert sample push subscription for testing
INSERT INTO mtcli_push_subscriptions (device_token, user_id, tenant_context, subscription_data)
VALUES 
  ('sample_device_token_123', 'user_clerk_123', 'default', 
   '{"player_id": "onesignal_player_123", "platform": "web"}'),
  ('sample_device_token_456', NULL, 'default',
   '{"player_id": "onesignal_player_456", "platform": "web"}')
ON CONFLICT DO NOTHING;

-- Insert sample notification preferences
INSERT INTO mtcli_notification_preferences (user_id, tenant_context, preferences)
VALUES 
  ('user_clerk_123', 'default', 
   '{"chat_requests": true, "attribute_updates": true, "reminders": false, "marketing": false}')
ON CONFLICT DO NOTHING;
