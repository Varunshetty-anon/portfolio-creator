import { chromium } from 'playwright';
import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'https://frames-aivg.onrender.com';
const TEST_USER = `audit${Date.now()}`;
const TEST_EMAIL = `${TEST_USER}@frames.com`;
const TEST_PASS = 'Frames!123';

async function runAudit() {
  console.log(`Starting Comprehensive E2E Audit for ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const results = {
    performance: {},
    architecture: {},
    design: {},
    upload: {},
    errors: []
  };

  try {
    // Listen to network to debug API
    page.on('response', async (response) => {
      const req = response.request();
      if (response.url().includes('/api/v1/portfolio')) {
        console.log(`\n[API REQ] ${req.method()} ${response.url()}`);
        if (req.postData()) {
          console.log(`[REQ BODY] ${req.postData()?.substring(0, 5000)}`);
        }
        try {
          const body = await response.text();
          console.log(`[API RESP] ${body.substring(0, 800)}`);
        } catch (e) {}
      }
    });

    // 1. PERFORMANCE & LOAD (Register / Login)
    const loadStart = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    results.performance.initialLoadMs = Date.now() - loadStart;
    
    console.log('Registering test user...');
    await page.click('button:has-text("Create Account")'); // Click the tab
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.fill('input[placeholder="Your name"]', 'Test User');
    await page.click('button[type="submit"]');

    // Onboarding - Step 0: Name
    await page.waitForURL('**/onboarding');
    await page.fill('input[placeholder="Your full name"]', 'Christopher Nolan');
    await page.click('button:has-text("Continue")');
    
    // Onboarding - Step 1: Username
    await page.fill('input[placeholder="yourname"]', TEST_USER);
    await page.click('button:has-text("Continue")');

    // Onboarding - Step 2: Role
    await page.click('button:has-text("Director")');
    await page.click('button:has-text("Create Portfolio")');
    
    // Editor Load
    await page.waitForURL('**/editor');
    results.performance.editorLoadMs = Date.now() - loadStart;

    // 2. ARCHITECTURE & DESIGN (Editor Check)
    console.log('Checking Editor Architecture...');
    // Ensure sidebar exists in editor but not theme panel
    const hasThemePanel = await page.locator('text=Theme Variant').isVisible();
    results.architecture.themeSystemRemoved = !hasThemePanel;

    // Add a project to test the live layout
    console.log('Adding test project...');
    await page.click('button[title="Projects"]');
    await page.click('button:has-text("New Project")');
    await page.click('button:has-text("Paste Link")');
    await page.fill('input[placeholder="YouTube, Vimeo, or direct link..."]', 'https://www.youtube.com/watch?v=Jm-upHSP9KU');
    await page.click('button:has-text("Save")');
    
    await page.fill('input[placeholder*="Nike"]', 'Inception');
    await page.waitForTimeout(1000); 
    
    // Publish changes
    await page.click('button:has-text("Publish")');
    await page.waitForSelector('button:has-text("Published")'); // Wait for publish to complete
    results.upload.projectCreation = 'Success';

    // 3. ARCHITECTURE & DESIGN (Live Portfolio Check)
    console.log('Checking Live Portfolio Layout...');
    const livePage = await context.newPage();
    
    livePage.on('response', async (response) => {
      const req = response.request();
      if (response.url().includes('/api/v1/portfolio')) {
        console.log(`\n[LIVE PAGE API REQ] ${req.method()} ${response.url()}`);
        try {
          const body = await response.text();
          console.log(`[LIVE PAGE API RESP] ${body.substring(0, 1000)}`);
        } catch (e) {}
      }
    });

    const liveLoadStart = Date.now();
    await livePage.goto(`${BASE_URL}/portfolio/${TEST_USER}`, { waitUntil: 'networkidle' });
    results.performance.portfolioLoadMs = Date.now() - liveLoadStart;

    // Check for Cinematic Index Architecture
    const hasSidebar = await livePage.locator('.w-80.fixed').isVisible().catch(() => false);
    const hasIndexList = await livePage.locator('ul.group\\/list').isVisible();
    const hasMassiveHero = await livePage.locator('h1.font-display').isVisible();
    
    results.architecture.sidebarRemoved = !hasSidebar;
    results.architecture.cinematicIndexPresent = hasIndexList;
    results.architecture.heroPresent = hasMassiveHero;

    // Dump DOM for debugging
    const html = await livePage.evaluate(() => document.body.innerHTML);
    console.log(`\n[LIVE PAGE DOM]\n${html.substring(0, 2000)}...\n`);

    livePage.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
    });
    livePage.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));

    // Hover interaction
    await livePage.hover('li:has-text("Inception")', { timeout: 10000 });
    await livePage.waitForTimeout(500); // wait for crossfade
    
    // Check Project Modal
    await livePage.click('li:has-text("Inception")');
    await livePage.waitForSelector('h2:has-text("Inception")');
    results.architecture.projectModalFunctional = true;

  } catch (error) {
    console.error('Audit failed during execution:', error);
    results.errors.push(error.message);
  } finally {
    await browser.close();
  }

  console.log('\n--- AUDIT RESULTS ---');
  console.log(JSON.stringify(results, null, 2));

  if (results.errors.length > 0 || !results.architecture.cinematicIndexPresent) {
    console.error('\n❌ ARCHITECTURE AUDIT FAILED: The vision does not match.');
    process.exit(1);
  } else {
    console.log('\n✅ ARCHITECTURE AUDIT PASSED: The Cinematic Index is live.');
  }
}

runAudit();
