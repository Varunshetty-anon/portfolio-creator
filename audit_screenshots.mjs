import { chromium } from 'playwright';
import path from 'path';

const THEMES = ['magazine', 'minimalism', 'glassmorphic', 'futuristic'];
const PORT = 3000;
const ARTIFACT_DIR = 'C:/Users/varun/.gemini/antigravity/brain/54f141dc-f1e0-4b43-a795-08b0bfd18700/';

async function waitForServer(url) {
  for (let i = 0; i < 60; i++) {
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
    console.error('Server failed to start');
    process.exit(1);
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const theme of THEMES) {
    console.log(`Capturing ${theme}...`);
    await page.goto(`http://localhost:${PORT}/audit-themes?theme=${theme}`, { waitUntil: 'networkidle' });
    
    // Wait for videos and animations
    await new Promise(r => setTimeout(r, 3000));

    const screenshotPath = path.join(ARTIFACT_DIR, `real_${theme}_screenshot.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved ${screenshotPath}`);
  }

  console.log('Done capturing screenshots.');
  await browser.close();
}

run().catch(console.error);
