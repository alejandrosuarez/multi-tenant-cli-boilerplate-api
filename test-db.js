// Load environment variables first
require('dotenv').config({ path: '.env.local' });

const DatabaseService = require('./src/services/database');

async function testDatabase() {
    const db = new DatabaseService();
    
    console.log('Testing database connection...');
    
    try {
        // Test basic connection
        const healthCheck = await db.healthCheck();
        console.log('Health check:', healthCheck);
        
        // Test existing table
        console.log('\nTesting existing table (mtcli_entities)...');
        const entitiesResult = await db.table('mtcli_entities').select('*').limit(1);
        console.log('Entities result:', entitiesResult.data ? 'SUCCESS' : 'FAILED');
        if (entitiesResult.error) {
            console.log('Entities error:', entitiesResult.error);
        }
        
        // Test notification tables
        console.log('\nTesting notification tables...');
        
        const tables = [
            'mtcli_notifications',
            'mtcli_push_subscriptions', 
            'mtcli_notification_preferences'
        ];
        
        for (const tableName of tables) {
            console.log(`\nTesting table: ${tableName}`);
            const result = await db.table(tableName).select('*').limit(1);
            
            if (result.error) {
                console.log(`❌ ${tableName}: ERROR - ${result.error.message}`);
            } else {
                console.log(`✅ ${tableName}: SUCCESS`);
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testDatabase();
