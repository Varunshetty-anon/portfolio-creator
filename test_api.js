const https = require('https');

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', (err) => resolve({ status: 500, error: err.message }));
  });
}

async function run() {
  console.log("=== FRAMES PRODUCTION AUDIT ===");
  const baseUrl = 'https://frames-aivg.onrender.com';
  
  const endpoints = [
    '/',
    '/api/v1/health',
    '/api/health',
    '/api/v1/auth/google'
  ];

  for (const ep of endpoints) {
    console.log(`\nTesting ${ep}...`);
    const result = await checkEndpoint(baseUrl + ep);
    console.log(`Status: ${result.status}`);
    console.log(`Preview: ${result.data ? result.data.substring(0, 100) : result.error}`);
  }
}

run();
