require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createTables() {
  try {
    // Use service role for DDL operations
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔧 Creating tables manually...');

    // Create categories table first
    console.log('📁 Creating mtcli_entity_categories table...');
    const { error: categoryError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS mtcli_entity_categories (
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
      `
    });

    if (categoryError) {
      console.error('❌ Category table error:', categoryError);
    } else {
      console.log('✅ Categories table created');
    }

    // Insert sample categories
    console.log('📊 Inserting sample categories...');
    const { error: insertError } = await supabase
      .from('mtcli_entity_categories')
      .upsert([
        {
          name: 'vehicle',
          display_name: 'Vehicles',
          description: 'Cars, trucks, motorcycles, etc.',
          base_schema: {
            year: null,
            make: null,
            model: null,
            price: null,
            mileage: null,
            color: null
          },
          tenant_id: 'default'
        },
        {
          name: 'property',
          display_name: 'Properties',
          description: 'Houses, apartments, commercial spaces',
          base_schema: {
            price: null,
            bedrooms: null,
            bathrooms: null,
            sqft: null,
            address: null
          },
          tenant_id: 'default'
        }
      ], { onConflict: 'name' });

    if (insertError) {
      console.error('❌ Insert categories error:', insertError);
    } else {
      console.log('✅ Sample categories inserted');
    }

    // Create entities table
    console.log('🏢 Creating mtcli_entities table...');
    const { error: entityError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS mtcli_entities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          owner_id TEXT,
          attributes JSONB DEFAULT '{}'::JSONB,
          share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
          public_shareable BOOLEAN DEFAULT FALSE,
          disabled BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_mtcli_entities_tenant ON mtcli_entities(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_mtcli_entities_type ON mtcli_entities(entity_type);
        CREATE INDEX IF NOT EXISTS idx_mtcli_entities_owner ON mtcli_entities(owner_id);
      `
    });

    if (entityError) {
      console.error('❌ Entity table error:', entityError);
    } else {
      console.log('✅ Entities table created');
    }

    // Create interaction logs table
    console.log('📝 Creating mtcli_interaction_logs table...');
    const { error: logError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS mtcli_interaction_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_id UUID,
          event_type TEXT NOT NULL,
          user_id TEXT,
          visitor_token TEXT,
          event_payload JSONB DEFAULT '{}'::JSONB,
          tenant_context TEXT,
          timestamp TIMESTAMPTZ DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_mtcli_logs_entity ON mtcli_interaction_logs(entity_id);
        CREATE INDEX IF NOT EXISTS idx_mtcli_logs_event_type ON mtcli_interaction_logs(event_type);
      `
    });

    if (logError) {
      console.error('❌ Interaction logs table error:', logError);
    } else {
      console.log('✅ Interaction logs table created');
    }

    console.log('🎉 Tables created successfully!');

    // Test basic functionality
    const { data: categories } = await supabase
      .from('mtcli_entity_categories')
      .select('*');
    
    console.log(`📋 Found ${categories?.length || 0} categories in database`);

  } catch (error) {
    console.error('💥 Failed to create tables:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createTables();
}

module.exports = createTables;