import { chromium, devices } from 'playwright';
import fs from 'fs';

const BASE_URL = 'https://frames-aivg.onrender.com';
const TEST_USER = `audit${Date.now()}`;
const TEST_EMAIL = `${TEST_USER}@frames.com`;
const TEST_PASS = 'Frames!123';

async function run() {
  console.log('Taking screenshots...');
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  const browser = await chromium.launch({ headless: true });
  
  // Desktop Context
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Landing Page
  await page.goto(BASE_URL);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/1_landing.png' });

  // Register & Onboard
  await page.click('button:has-text("Create Account")');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASS);
  await page.fill('input[placeholder="Your name"]', 'Test User');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/onboarding');
  await page.fill('input[placeholder="Your full name"]', 'Christopher Nolan');
  await page.click('button:has-text("Continue")');
  await page.fill('input[placeholder="yourname"]', TEST_USER);
  await page.click('button:has-text("Continue")');
  await page.click('button:has-text("Director")');
  await page.click('button:has-text("Create Portfolio")');

  // Editor Layout
  await page.waitForURL('**/editor');
  await page.waitForTimeout(3000); // let animations settle
  await page.screenshot({ path: 'screenshots/2_editor.png' });

  // Add Project
  await page.click('button:has-text("Projects")');
  await page.click('button:has-text("New Project")');
  await page.click('button:has-text("Paste Link")');
  await page.fill('input[placeholder="YouTube, Vimeo, or direct link..."]', 'https://www.youtube.com/watch?v=Jm-upHSP9KU');
  await page.click('button:has-text("Save")');
  await page.fill('input[placeholder*="Nike"]', 'Inception');
  await page.waitForTimeout(2000);
  
  // Publish
  await page.click('button:has-text("Publish")');
  await page.waitForSelector('button:has-text("Published")');

  // Live Portfolio Desktop
  const livePage = await context.newPage();
  await livePage.goto(`${BASE_URL}/portfolio/${TEST_USER}`);
  await livePage.waitForTimeout(3000);

  // Hero Section
  await livePage.screenshot({ path: 'screenshots/3_hero_desktop.png' });

  // Project Index (scroll down)
  await livePage.evaluate(() => window.scrollBy(0, 500));
  await livePage.waitForTimeout(1000);
  await livePage.screenshot({ path: 'screenshots/4_index_desktop.png' });

  // Hovered Project State
  await livePage.hover('div:has-text("Inception")');
  await livePage.waitForTimeout(1500); // wait for crossfade
  await livePage.screenshot({ path: 'screenshots/5_hover_desktop.png' });

  // Open Project Modal
  await livePage.click('div:has-text("Inception")');
  await livePage.waitForTimeout(1500);
  await livePage.screenshot({ path: 'screenshots/6_modal_desktop.png' });

  // Tablet Layout
  const tabletContext = await browser.newContext(devices['iPad Pro 11']);
  const tabletPage = await tabletContext.newPage();
  await tabletPage.goto(`${BASE_URL}/portfolio/${TEST_USER}`);
  await tabletPage.waitForTimeout(3000);
  await tabletPage.screenshot({ path: 'screenshots/7_tablet.png', fullPage: true });

  // Mobile Layout
  const mobileContext = await browser.newContext(devices['iPhone 13']);
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${BASE_URL}/portfolio/${TEST_USER}`);
  await mobilePage.waitForTimeout(3000);
  await mobilePage.screenshot({ path: 'screenshots/8_mobile.png', fullPage: true });

  await browser.close();
  console.log('Screenshots complete.');
}

run();
