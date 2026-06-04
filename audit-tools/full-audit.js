const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'audit-results');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Generate a dummy 50MB video file
const dummyVideoPath = path.join(OUTPUT_DIR, 'dummy-50mb.mp4');
if (!fs.existsSync(dummyVideoPath)) {
  console.log('Generating dummy 50MB file...');
  const buffer = Buffer.alloc(50 * 1024 * 1024, 'a');
  fs.writeFileSync(dummyVideoPath, buffer);
}

async function runAudit() {
  console.log('🚀 Starting Full Audit...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  const networkLogs = [];

  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('requestfailed', request => networkLogs.push(`[FAILED] ${request.url()} - ${request.failure().errorText}`));
  page.on('response', response => {
    if (response.status() >= 400) {
      networkLogs.push(`[ERROR ${response.status()}] ${response.url()}`);
    }
  });

  try {
    // 1. Auth: Sign up
    console.log('Testing Auth...');
    await page.goto(`${BASE_URL}`);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-landing.png') });
    
    // Find signup button
    await page.click('text="Get Started"');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-auth-modal.png') });
    
    // Fill out form
    const timestamp = Date.now();
    await page.fill('input[type="email"]', `test-${timestamp}@example.com`);
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[placeholder="Display Name"]', 'Test User');
    await page.click('button:has-text("Create Account")');
    
    console.log('Waiting for login...');
    await page.waitForURL('**/editor', { timeout: 15000 }).catch(() => console.log('Timeout waiting for /editor'));
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-editor-initial.png') });

    // 2. Profile: Edit Profile
    console.log('Testing Profile & Uploads...');
    await page.fill('input[value="Test User"]', 'Updated Test User');
    await page.fill('input[placeholder="e.g. Lead Video Editor"]', 'Filmmaker');
    
    // Wait for auto-save
    await page.waitForTimeout(2000);
    
    // 3. Projects: Create Project
    console.log('Testing Projects...');
    await page.click('button:has-text("Add Project")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-new-project-added.png') });

    // Try adding a YouTube link
    const projectInputs = await page.$$('input[placeholder="e.g. Neon Dreams"]');
    if (projectInputs.length > 0) {
      await projectInputs[0].fill('Test YouTube Project');
    }
    
    // Expand media section if needed
    // Assuming UI has a 'Media' or 'Video Link' field
    const urlInputs = await page.$$('input[placeholder*="YouTube"]');
    if (urlInputs.length > 0) {
      await urlInputs[0].fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      await page.waitForTimeout(3000); // Wait for metadata extraction
      await page.screenshot({ path: path.join(OUTPUT_DIR, '05-youtube-embedded.png') });
    }

    // 4. Portfolio Themes
    console.log('Testing Portfolio Themes...');
    await page.click('button:has-text("Publish")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06-publish-modal.png') });
    
    // Go to public portfolio
    const viewPortfolioBtn = await page.$('a:has-text("View Portfolio")');
    if (viewPortfolioBtn) {
      const href = await viewPortfolioBtn.getAttribute('href');
      await page.goto(`${BASE_URL}${href}`);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '07-public-portfolio.png'), fullPage: true });
    } else {
      console.log('Could not find View Portfolio link');
    }
    
    console.log('Audit completed successfully.');
    
  } catch (err) {
    console.error('Audit failed:', err);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'ERROR-crash.png') });
  } finally {
    fs.writeFileSync(path.join(OUTPUT_DIR, 'console-logs.txt'), consoleLogs.join('\n'));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'network-logs.txt'), networkLogs.join('\n'));
    await browser.close();
  }
}

runAudit();
