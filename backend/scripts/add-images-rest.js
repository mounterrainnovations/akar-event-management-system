const https = require('https');

const PROJECT_REF = 'hflfauratacalmqlwdjd';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmbGZhdXJhdGFjYWxtcWx3ZGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkxMzYwNCwiZXhwIjoyMDg2NDg5NjA0fQ.kik33rg8xqKXezu9BYuy9PbB5K_pJZqHtkcD8rguSf4';

const sql = "ALTER TABLE works ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';";

const body = JSON.stringify({ query: sql });

const options = {
  hostname: `${PROJECT_REF}.supabase.co`,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log(`Attempting migration on project: ${PROJECT_REF}`);
console.log('SQL:', sql);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.write(body);
req.end();
