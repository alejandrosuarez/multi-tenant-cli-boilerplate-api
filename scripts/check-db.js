require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkDatabase() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔍 Checking existing database structure...');

    // Try to query information_schema to see what tables exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'mtcli_%');

    if (error) {
      console.log('ℹ️  Cannot access information_schema, trying direct table access...');
      
      // Try to access our tables directly
      const testQueries = [
        { name: 'mtcli_entity_categories', table: 'mtcli_entity_categories' },
        { name: 'mtcli_entities', table: 'mtcli_entities' },
        { name: 'mtcli_interaction_logs', table: 'mtcli_interaction_logs' }
      ];

      for (const query of testQueries) {
        try {
          const { data, error } = await supabase
            .from(query.table)
            .select('*')
            .limit(1);
          
          if (error) {
            console.log(`❌ ${query.name}: ${error.message}`);
          } else {
            console.log(`✅ ${query.name}: Table exists (${data?.length || 0} sample records)`);
          }
        } catch (err) {
          console.log(`❌ ${query.name}: ${err.message}`);
        }
      }
    } else {
      console.log('📋 Found mtcli tables:', tables?.map(t => t.table_name) || 'none');
    }

    // Test a simple insert into categories if table exists
    console.log('\n🧪 Testing category creation...');
    const { data: categoryData, error: categoryError } = await supabase
      .from('mtcli_entity_categories')
      .upsert({
        name: 'test_vehicle',
        display_name: 'Test Vehicles',
        description: 'Test category for vehicles',
        base_schema: { year: null, make: null },
        tenant_id: 'default'
      }, { onConflict: 'name' })
      .select();

    if (categoryError) {
      console.log('❌ Category creation failed:', categoryError.message);
    } else {
      console.log('✅ Category creation successful:', categoryData);
    }

  } catch (error) {
    console.error('💥 Database check failed:', error);
  }
}

checkDatabase();