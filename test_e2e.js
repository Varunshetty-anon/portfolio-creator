const https = require('https');

function makeRequest(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'frames-aivg.onrender.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (cookie) options.headers['Cookie'] = cookie;
    if (body) options.headers['Content-Length'] = data.length;

    const req = https.request(options, res => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let setCookie = res.headers['set-cookie'] || [];
        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookies: setCookie,
          body: responseBody
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });
}

function extractCookies(cookieArray) {
  return cookieArray.map(c => c.split(';')[0]).join('; ');
}

async function run() {
  const timestamp = Date.now();
  const testEmail = `test_${timestamp}@example.com`;
  const testPassword = 'password123';
  const testUsername = `user-${timestamp}`;

  console.log(`\n=== E2E PROD TEST: NEW USER ===`);
  console.log(`1. Signing up user: ${testEmail}`);
  const signupRes = await makeRequest('POST', '/api/v1/auth/signup', {
    email: testEmail,
    password: testPassword,
    displayName: 'Test User'
  });
  
  console.log(`Signup Status: ${signupRes.status}`);
  console.log(`Signup Body:`, signupRes.body);

  if (signupRes.status !== 201) {
    console.error('Signup failed. Aborting.');
    return;
  }

  const cookies = extractCookies(signupRes.cookies);
  console.log(`\nExtracted Session Cookies:`, cookies);

  console.log(`\n2. Checking GET /portfolio (Frontend: checkExistingPortfolio)`);
  const getPort1 = await makeRequest('GET', '/api/v1/portfolio', null, cookies);
  console.log(`GET Portfolio Status: ${getPort1.status}`);
  console.log(`GET Portfolio Body:`, getPort1.body);

  console.log(`\n3. Checking GET /auth/me (Frontend: refreshUser)`);
  const getMe1 = await makeRequest('GET', '/api/v1/auth/me', null, cookies);
  console.log(`GET /auth/me Status: ${getMe1.status}`);
  console.log(`GET /auth/me Body:`, getMe1.body);

  console.log(`\n4. Simulating Onboarding Submit -> POST /portfolio`);
  const postPort = await makeRequest('POST', '/api/v1/portfolio', {
    name: 'Test Name',
    username: testUsername,
    role: 'Editor'
  }, cookies);
  console.log(`POST Portfolio Status: ${postPort.status}`);
  console.log(`POST Portfolio Body:`, postPort.body);

  console.log(`\n5. Checking GET /auth/me again (Frontend: refreshUser after submit)`);
  const getMe2 = await makeRequest('GET', '/api/v1/auth/me', null, cookies);
  console.log(`GET /auth/me Status: ${getMe2.status}`);
  console.log(`GET /auth/me Body:`, getMe2.body);

  console.log(`\n=== E2E PROD TEST: EXISTING USER (Re-login) ===`);
  console.log(`1. Logging in again`);
  const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
    email: testEmail,
    password: testPassword
  });
  console.log(`Login Status: ${loginRes.status}`);
  const newCookies = extractCookies(loginRes.cookies);

  console.log(`\n2. Checking GET /portfolio for EXISTING user`);
  const getPort2 = await makeRequest('GET', '/api/v1/portfolio', null, newCookies);
  console.log(`GET Portfolio Status: ${getPort2.status}`);
  console.log(`GET Portfolio Body:`, getPort2.body);

  console.log(`\n3. Checking GET /auth/me for EXISTING user`);
  const getMe3 = await makeRequest('GET', '/api/v1/auth/me', null, newCookies);
  console.log(`GET /auth/me Status: ${getMe3.status}`);
  console.log(`GET /auth/me Body:`, getMe3.body);
}

run().catch(console.error);
