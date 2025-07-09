require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables Test:');
console.log('==========================');
console.log('API_TOKENS:', process.env.API_TOKENS);
console.log('ALLOWED_DOMAINS:', process.env.ALLOWED_DOMAINS);
console.log('ONESIGNAL_API_KEY:', process.env.ONESIGNAL_API_KEY ? 'SET' : 'NOT SET');
console.log('ONESIGNAL_APP_ID:', process.env.ONESIGNAL_APP_ID ? 'SET' : 'NOT SET');

const tokens = process.env.API_TOKENS ? process.env.API_TOKENS.split(',') : [];
console.log('\nValid API Tokens:', tokens);
console.log('Test token check:', tokens.includes('test-token-123'));
