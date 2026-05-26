const { chromium } = require('playwright');
const axios = require('axios');

const BASE_URL = 'https://frames-aivg.onrender.com';

async function runLiveAudit() {
  console.log('====================================================');
  console.log('🔥 STARTING LIVE CONTINUOUS DEBUGGING AUDIT');
  console.log('====================================================');
  
  const browser = await chromium.launch({ headless: false });
  let context = await browser.newContext();
  let page = await context.newPage();

  // Attach massive debug listeners
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    } else {
      console.log(`[BROWSER CONSOLE] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`[PAGE UNCAUGHT ERROR] ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.log(`[NETWORK FAIL] ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on('response', async response => {
    if (response.url().includes('/api/v1/')) {
      console.log(`[API RESPONSE] ${response.status()} ${response.url()}`);
      if (response.status() >= 400) {
        try {
          const body = await response.text();
          console.log(`[API ERROR BODY] ${body}`);
        } catch (e) {}
      }
    }
  });

  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log(`[NAVIGATION] URL changed to: ${frame.url()}`);
    }
  });

  console.log('\n[TEST CASE 1] FRESH GOOGLE ACCOUNT');
  console.log('Navigating to production site...');
  await page.goto(BASE_URL);

  console.log('\n====================================================');
  console.log('⚠️  ACTION REQUIRED FROM YOU (THE HUMAN):');
  console.log('1. Log in with a FRESH Google account.');
  console.log('2. Complete the onboarding form.');
  console.log('3. Wait for the editor to open.');
  console.log('====================================================\n');
  
  try {
    // Wait for the user to reach the editor
    await page.waitForURL(/.*editor.*/, { timeout: 300000 }); // 5 minutes
    console.log('✅ PASS: Reached /editor successfully.');

    // Give it a moment to render
    await page.waitForTimeout(2000);

    console.log('\n--- INITIATING REFRESH TEST ---');
    console.log('Reloading the page...');
    await page.reload();

    console.log('Waiting for URL to settle...');
    // Wait for network idle or 15 seconds max
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch(e) {
      console.log('Timeout waiting for network idle, proceeding anyway...');
    }
    
    const finalUrl = page.url();
    console.log(`[REFRESH RESULT] Final URL is: ${finalUrl}`);

    if (finalUrl.includes('editor')) {
      console.log('✅ PASS: Editor persists after refresh!');
    } else {
      console.log('❌ FAIL: Editor did not persist. Final URL: ' + finalUrl);
      
      // Dump the DOM body to see what is rendering
      const bodyHTML = await page.innerHTML('body');
      console.log('\n--- DOM DUMP ---');
      console.log(bodyHTML.substring(0, 1000) + '...');
      console.log('----------------\n');
    }

    console.log('\n--- CONTINUOUS MONITORING ACTIVE ---');
    console.log('You may now manually test LOGOUT -> LOGIN AGAIN.');
    console.log('I will leave this script running for 10 minutes to capture all logs.');
    
    // Just wait and log for 10 minutes
    await page.waitForTimeout(600000);
    
  } catch (err) {
    console.log('\n❌ [SCRIPT EXCEPTION]', err.message);
    const finalUrl = page.url();
    console.log(`Final URL at crash: ${finalUrl}`);
    const bodyHTML = await page.innerHTML('body').catch(() => 'Could not get body');
    console.log('\n--- DOM DUMP ---');
    console.log(bodyHTML.substring(0, 1000) + '...');
    console.log('----------------\n');
  }

  await browser.close();
}

runLiveAudit().catch(err => {
  console.error('Audit failed:', err);
});
