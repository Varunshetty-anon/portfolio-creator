const { chromium } = require('playwright');

const BASE_URL = 'https://frames-aivg.onrender.com';

async function runInteractiveAudit() {
  console.log('====================================================');
  console.log('🎬 STARTING INTERACTIVE PRODUCTION AUDIT');
  console.log('====================================================');
  console.log('A Chrome window will now open.');
  console.log('Please log in using your Google account when prompted.');
  console.log('The script will wait until you reach the Onboarding or Editor page.');
  
  // Launch in non-headless mode so the user can interact
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\nNavigating to production site...');
  await page.goto(BASE_URL);

  console.log('Waiting for you to log in with Google...');
  console.log('Take your time. The script will detect when you finish.');

  // Wait until the URL changes to /onboarding or /editor
  await page.waitForURL(/.*(onboarding|editor).*/, { timeout: 120000 }); // 2 minutes timeout

  const currentUrl = page.url();
  console.log('\n✅ Login successful! Redirected to:', currentUrl);

  if (currentUrl.includes('onboarding')) {
    console.log('→ Detected NEW USER flow (Onboarding)');
    console.log('Checking onboarding state...');
    
    // Check if form exists
    const inputCount = await page.locator('input').count();
    if (inputCount > 0) {
      console.log('✅ Onboarding form is rendering correctly.');
    } else {
      console.log('❌ Onboarding form missing.');
    }
    
    console.log('\nPlease complete the onboarding form manually in the browser.');
    console.log('Waiting for you to reach the editor...');
    await page.waitForURL(/.*editor.*/, { timeout: 120000 });
    console.log('✅ Reached editor successfully.');
  } else if (currentUrl.includes('editor')) {
    console.log('→ Detected EXISTING USER flow (Skipped onboarding)');
    console.log('✅ Direct editor access verified.');
  }

  // Check cookies to verify session
  const cookies = await context.cookies();
  const tokenCookie = cookies.find(c => c.name === 'frames_token');
  const refreshCookie = cookies.find(c => c.name === 'frames_refresh');
  
  if (tokenCookie && refreshCookie) {
    console.log('✅ Auth cookies (frames_token, frames_refresh) are properly set.');
  } else {
    console.log('❌ Auth cookies missing!');
  }

  // Wait to let user see
  await page.waitForTimeout(5000);
  
  console.log('\nClosing browser and finishing audit...');
  await browser.close();
  console.log('Audit complete.');
}

runInteractiveAudit().catch(err => {
  console.error('Audit failed:', err);
});
