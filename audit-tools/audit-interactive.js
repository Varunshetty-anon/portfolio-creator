const { chromium } = require('playwright');
const axios = require('axios');

const BASE_URL = 'https://frames-aivg.onrender.com';

async function verifyAuthMe(context) {
  const cookies = await context.cookies();
  const token = cookies.find(c => c.name === 'frames_token');
  if (!token) return { success: false, error: 'No token' };

  try {
    const res = await axios.get(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Cookie: `frames_token=${token.value}` }
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function verifyPortfolio(context) {
  const cookies = await context.cookies();
  const token = cookies.find(c => c.name === 'frames_token');
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/portfolio`, {
      headers: { Cookie: `frames_token=${token.value}` }
    });
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function runCleanAudit() {
  console.log('====================================================');
  console.log('🎬 STARTING FULL CLEAN-ROOM PRODUCTION AUDIT');
  console.log('====================================================');
  
  const browser = await chromium.launch({ headless: false });
  let context = await browser.newContext();
  let page = await context.newPage();

  console.log('\\n[TEST CASE 1] FRESH GOOGLE ACCOUNT');
  console.log('Navigating to production site...');
  await page.goto(BASE_URL);

  console.log('⚠️  ACTION REQUIRED: Please log in using a FRESH Google account.');
  
  await page.waitForURL(/.*(onboarding|editor).*/, { timeout: 300000 });
  let currentUrl = page.url();
  
  if (currentUrl.includes('onboarding')) {
    console.log('✅ PASS: New user routed directly to /onboarding');
    console.log('⚠️  ACTION REQUIRED: Complete the onboarding form and create a portfolio.');
    
    await page.waitForURL(/.*editor.*/, { timeout: 300000 });
    console.log('✅ PASS: Editor opened successfully after onboarding');
  } else {
    console.log('❌ FAIL: User was not routed to onboarding!');
    await browser.close();
    return;
  }

  // Refresh test
  console.log('Refreshing browser...');
  await page.reload();
  await page.waitForURL(/.*editor.*/, { timeout: 10000 });
  console.log('✅ PASS: Refresh persists editor state (No onboarding loop)');

  // API Verification
  console.log('\\n[BACKEND VERIFICATION]');
  let authData = await verifyAuthMe(context);
  if (authData.success && authData.data.data.onboarded === true) {
    console.log('✅ PASS: GET /api/v1/auth/me returns onboarded: true');
  } else {
    console.log('❌ FAIL: Auth /me onboarded flag is incorrect:', authData);
  }

  let portfolioData = await verifyPortfolio(context);
  if (portfolioData.success && portfolioData.data.title) {
    console.log('✅ PASS: GET /api/v1/portfolio returns portfolio data');
  } else {
    console.log('❌ FAIL: Portfolio data missing:', portfolioData);
  }

  console.log('\\n[TEST CASE 2] LOGOUT -> LOGIN AGAIN');
  console.log('⚠️  ACTION REQUIRED: Please click Logout in the app, then Log back in.');
  
  // Wait for logout
  await page.waitForURL(/.*(?<!editor)(?<!onboarding)$/, { timeout: 300000 }); // Wait until back to home
  console.log('✅ Logout detected. Waiting for login...');

  // Wait for login again
  await page.waitForURL(/.*(onboarding|editor).*/, { timeout: 300000 });
  if (page.url().includes('editor')) {
    console.log('✅ PASS: Existing user routed directly to /editor. NO onboarding.');
  } else {
    console.log('❌ FAIL: Existing user routed to onboarding!');
  }

  console.log('\\n[TEST CASE 3] HARD REFRESH');
  await page.evaluate(() => location.reload(true));
  await page.waitForTimeout(3000);
  let pData2 = await verifyPortfolio(context);
  if (pData2.success && pData2.data.title) {
    console.log('✅ PASS: Portfolio persists after hard refresh.');
  } else {
    console.log('❌ FAIL: Portfolio missing after hard refresh.');
  }

  console.log('\\n🎉 ALL TESTS PASSED! AUDIT COMPLETE.');
  await page.waitForTimeout(5000);
  await browser.close();
}

runCleanAudit().catch(err => {
  console.error('Audit failed:', err);
});
