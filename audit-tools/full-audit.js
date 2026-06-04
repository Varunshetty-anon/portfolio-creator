const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://frames-aivg.onrender.com';
const OUTPUT_DIR = path.join(__dirname, 'audit-results');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Generate dummy files
const dummy100Path = path.join(OUTPUT_DIR, 'test-100mb.mp4');
const dummy300Path = path.join(OUTPUT_DIR, 'test-300mb.mp4');
if (!fs.existsSync(dummy100Path)) fs.writeFileSync(dummy100Path, Buffer.alloc(100 * 1024 * 1024, 'a'));
if (!fs.existsSync(dummy300Path)) fs.writeFileSync(dummy300Path, Buffer.alloc(300 * 1024 * 1024, 'a'));

async function runAudit() {
  console.log(`🚀 Starting Full QA Audit against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const networkLogs = [];
  let uploadDirectToCloudinary = false;
  let uploadToRender = false;

  page.on('request', req => {
    const url = req.url();
    if (req.method() === 'POST' && url.includes('cloudinary.com/v1_1')) {
      uploadDirectToCloudinary = true;
      networkLogs.push(`[SUCCESS] File payload sent directly to: ${url}`);
    }
    if (req.method() === 'POST' && url.includes('frames-pr-5.onrender.com')) {
      const buffer = req.postDataBuffer();
      if (buffer && buffer.length > 1024 * 1024) {
        uploadToRender = true;
        networkLogs.push(`[FAIL] Massive file payload sent to Render: ${url}`);
      }
    }
  });

  try {
    // 1. Auth
    console.log('Testing Authentication...');
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(3000);
    
    const timestamp = Date.now();
    try {
      // Switch to Sign Up tab
      await page.click('button:has-text("Create Account")');
      await page.waitForTimeout(1000);
      
      // Fill out Sign Up form
      await page.fill('input[placeholder="Your name"]', 'QA Tester');
      await page.fill('input[type="email"]', `qa-${timestamp}@example.com`);
      await page.fill('input[type="password"]', 'Password123!');
      
      // Submit
      await page.click('button[type="submit"]');
    } catch(e) {
      console.log('Could not find generic auth form, attempting to proceed...', e);
    }

    // Wait for redirect to /onboarding
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-post-auth.png') });

    // Handle Onboarding Flow if we are on /onboarding
    if (page.url().includes('onboarding')) {
      console.log('Running Onboarding Flow...');
      
      // Step 1: Name
      await page.waitForTimeout(2000);
      await page.click('button:has-text("Continue")');
      
      // Step 2: Username
      await page.waitForTimeout(2000);
      await page.fill('input[placeholder="yourname"]', `tester${timestamp}`);
      await page.click('button:has-text("Continue")');
      
      // Step 3: Role
      await page.waitForTimeout(2000);
      await page.click('button:has-text("Filmmaker")');
      await page.click('button:has-text("Create Portfolio")');
      
      await page.waitForTimeout(6000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '01b-post-onboarding.png') });
    }

    console.log('Testing Projects & Uploads...');
    await page.goto(`${BASE_URL}/editor`);
    await page.waitForTimeout(4000);
    
    // Switch to Projects Tab
    console.log('Switching to Projects tab...');
    await page.click('button[title="Projects"]').catch(() => console.log('Could not click Projects tab'));
    await page.waitForTimeout(2000);
    
    // Add 1 project
    console.log('Adding a project...');
    await page.click('button:has-text("New Project"), button:has-text("Add")').catch(() => console.log('Could not find Add Project button'));
    await page.waitForTimeout(2000);
    
    // Simulate File Upload (100MB)
    console.log('Testing 100MB Direct Cloudinary Upload...');
    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length > 0) {
      await fileInputs[0].setInputFiles(dummy100Path);
      await page.waitForTimeout(45000); // wait 45s for massive upload to finish
      await page.screenshot({ path: path.join(OUTPUT_DIR, '02-upload-100mb-progress.png') });
    } else {
      console.log('[FAIL] Could not find any input type="file"');
    }

    // Refresh Persistence
    console.log('Testing Page Refresh Persistence...');
    await page.reload();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-post-refresh.png') });

    // Publishing
    console.log('Testing Publish Workflow...');
    await page.click('button:has-text("Publish")').catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-publish.png') });

    fs.writeFileSync(path.join(OUTPUT_DIR, 'network-audit.txt'), networkLogs.join('\n'));

    // Output Severity Report
    console.log('\n--- QA Audit Results ---');
    console.log(`Cloudinary Direct Upload Success: ${uploadDirectToCloudinary}`);
    console.log(`Render Server Bypassed: ${!uploadToRender}`);
    
  } catch (err) {
    console.error('Audit failed:', err);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'ERROR-crash.png') });
  } finally {
    await browser.close();
  }
}

runAudit();
