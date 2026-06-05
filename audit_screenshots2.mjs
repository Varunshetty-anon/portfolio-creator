import { chromium } from 'playwright';
import path from 'path';
import { exec } from 'child_process';
import fetch from 'node-fetch';

const PORT = 3001;
const ARTIFACT_DIR = 'C:/Users/varun/.gemini/antigravity/brain/17bfdcde-cd63-4f3b-aa7f-5bac06de61aa/';

async function waitForServer(url) {
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(url);
      console.log('Server is ready!');
      return true;
    } catch (e) {
      console.log('Waiting for server...');
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
}

async function run() {
  const isReady = await waitForServer(`http://localhost:${PORT}`);
  if (!isReady) {
    console.error('Server is not running on ' + PORT);
    process.exit(1);
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  
  // Desktop Portfolio
  console.log('Capturing Desktop Portfolio...');
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktopPage.goto(`http://localhost:${PORT}/audit-portfolio`, { waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 3500)); // Wait for intro animation to finish (2.8s) + a bit more
  await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_portfolio.png'), fullPage: true });


  // Mobile Portfolio
  console.log('Capturing Mobile Portfolio...');
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto(`http://localhost:${PORT}/audit-portfolio`, { waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 3500));
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_portfolio.png'), fullPage: true });

  console.log('Done capturing screenshots. Closing browser.');
  await browser.close();
}

run().catch(console.error);
