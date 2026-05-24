const { chromium } = require('playwright');
const axios = require('axios');

const BASE_URL = 'https://frames-aivg.onrender.com';

async function runAudit() {
  console.log('--- STARTING PLAYWRIGHT AUDIT ---');
  const browser = await chromium.launch(); // headless: true by default
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. API Health Check
  try {
    const health = await axios.get(`${BASE_URL}/api/v1/health`);
    console.log('✅ API Health Check:', health.status);
  } catch (err) {
    console.log('❌ API Health Check failed:', err.message);
  }

  // 2. Google Auth Flow Test
  console.log('\n--- TESTING GOOGLE LOGIN BUTTON ---');
  await page.goto(BASE_URL);
  
  // Look for login button
  const loginButton = page.locator('text=/log in|sign in|get started/i').first();
  if (await loginButton.count() > 0) {
    console.log('✅ Found login/get started button');
    
    // Check if it's a link to Google or opens a modal
    const href = await loginButton.getAttribute('href');
    if (href && href.includes('google')) {
      console.log('✅ Button links to Google Auth:', href);
    } else {
      await loginButton.click();
      await page.waitForTimeout(2000);
      const googleBtn = page.locator('a[href*="/api/v1/auth/google"]');
      if (await googleBtn.count() > 0) {
        console.log('✅ Found Google auth button in modal');
      } else {
        console.log('❌ Could not find Google Auth button in UI');
      }
    }
  }

  // 3. Create Local Test User for Onboarding flow
  console.log('\n--- TESTING API SIGNUP ---');
  const testEmail = `audit_${Date.now()}@test.com`;
  let cookies = [];
  try {
    const signupRes = await axios.post(`${BASE_URL}/api/v1/auth/signup`, {
      email: testEmail,
      password: 'password123',
      displayName: 'Audit Tester'
    });
    console.log('✅ Local Signup successful:', signupRes.data.data.user.email);
    
    // Extract cookies from response
    const setCookie = signupRes.headers['set-cookie'];
    if (setCookie) {
      setCookie.forEach(cookieStr => {
        const [full, name, value] = cookieStr.match(/([^=]+)=([^;]+)/);
        cookies.push({
          name: name.trim(),
          value: value,
          domain: 'frames-aivg.onrender.com',
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax'
        });
      });
      console.log('✅ Extracted auth cookies');
    }
  } catch (err) {
    console.log('❌ Signup failed:', err.response?.data || err.message);
  }

  // 4. Test New User Flow (Onboarding)
  console.log('\n--- TESTING NEW USER FLOW (ONBOARDING) ---');
  if (cookies.length > 0) {
    await context.addCookies(cookies);
    await page.goto(`${BASE_URL}/editor`);
    await page.waitForTimeout(3000); // let routing settle
    
    const url = page.url();
    console.log('URL after auth nav:', url);
    
    if (url.includes('onboarding')) {
      console.log('✅ New user successfully redirected to onboarding');
      
      // Try to submit onboarding
      const nextBtn = page.locator('button:has-text("Next")');
      const submitBtn = page.locator('button:has-text("Complete")');
      // basic interaction to see if form is there
      if (await page.locator('input').count() > 0) {
        console.log('✅ Onboarding form inputs found');
      }
    } else {
      console.log('❌ Expected redirect to /onboarding, but got:', url);
    }
  } else {
    console.log('⚠️ Skipping UI auth flow due to missing cookies.');
  }

  // 5. Test APIs Directly
  console.log('\n--- API AUDIT ---');
  try {
    // We can use the cookies in axios
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const axiosAuth = axios.create({
      baseURL: BASE_URL,
      headers: { Cookie: cookieHeader }
    });

    const meRes = await axiosAuth.get('/api/v1/auth/me');
    console.log('✅ Auth /me works. User:', meRes.data.data.user.email);

    // Try media upload
    try {
      const FormData = require('form-data');
      const fs = require('fs');
      fs.writeFileSync('dummy.jpg', 'fake image data');
      const formData = new FormData();
      formData.append('image', fs.createReadStream('dummy.jpg'), 'dummy.jpg');
      
      const upRes = await axiosAuth.post('/api/v1/upload/profile-image', formData, {
        headers: formData.getHeaders()
      });
      console.log('✅ Image upload works:', upRes.data.data.url);
    } catch (e) {
      console.log('❌ Image upload failed:', e.response?.data || e.message);
    }

    // Try creating portfolio
    try {
      const pRes = await axiosAuth.post('/api/v1/portfolio', {
        username: `user-${Date.now()}`,
        name: 'Audit Test',
        role: 'Tester'
      });
      console.log('✅ Portfolio creation works:', pRes.data.data.portfolio.username);
      
      // Try to update portfolio
      const upRes = await axiosAuth.put('/api/v1/portfolio', {
        bio: 'Updated bio during audit'
      });
      console.log('✅ Portfolio update works. Bio:', upRes.data.data.portfolio.bio);
    } catch (e) {
      console.log('❌ Portfolio API failed:', e.response?.data || e.message);
    }

  } catch (e) {
    console.log('❌ API Auth/Endpoints failed:', e.response?.data || e.message);
  }

  await browser.close();
  console.log('\n--- AUDIT COMPLETE ---');
}

runAudit();
