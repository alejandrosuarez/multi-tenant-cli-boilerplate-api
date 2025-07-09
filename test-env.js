require('dotenv').config({ path: '.env.local' });

console.log('Environment variables check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

if (process.env.SUPABASE_URL) {
    console.log('SUPABASE_URL value:', process.env.SUPABASE_URL);
}

console.log('\nAll environment variables containing SUPABASE:');
Object.keys(process.env).filter(key => key.includes('SUPABASE')).forEach(key => {
    console.log(`${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
});
