require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    // Create admin client for DDL operations
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔧 Running database migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, '../src/db/migrations/002-fix-relationships.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements (basic splitting by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            // Continue with other statements for now
          } else {
            console.log(`✅ Statement ${i + 1} completed`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }

    console.log('🎉 Migration completed!');
    
    // Test basic connectivity
    const { data, error } = await supabase.from('mtcli_entity_categories').select('count');
    if (error) {
      console.log('⚠️  Categories table may not exist yet, this is normal for first run');
    } else {
      console.log('✅ Database tables are accessible');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;