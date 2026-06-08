import { chromium } from 'playwright';
import path from 'path';
import fetch from 'node-fetch';

const PORT = 3001;
const ARTIFACT_DIR = 'C:/Users/varun/.gemini/antigravity/brain/58fc36df-1457-405d-b3fc-84f841967157/';

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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto(`http://localhost:${PORT}/audit-videos`, { waitUntil: 'domcontentloaded' });
  
  // Wait a few seconds for all iframe/players to instantiate
  await new Promise(r => setTimeout(r, 5000));

  console.log('Capturing Video Reliability Audit...');
  
  const vimeoEl = await page.locator('#player-vimeo');
  await vimeoEl.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_vimeo.png') });

  const ytEl = await page.locator('#player-youtube');
  await ytEl.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_youtube.png') });

  const driveEl = await page.locator('#player-drive');
  await driveEl.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_drive.png') });

  const mp4El = await page.locator('#player-mp4');
  await mp4El.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_mp4.png') });

  const errorEl = await page.locator('#player-error');
  await errorEl.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_error.png') });

  const loadingEl = await page.locator('#player-loading');
  await loadingEl.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_loading.png') });


  console.log('Capturing Presentation Strategies Audit...');
  
  const stratA = await page.locator('#strategy-a');
  await stratA.screenshot({ path: path.join(ARTIFACT_DIR, 'strategy_a_background.png') });

  const stratB = await page.locator('#strategy-b');
  await stratB.screenshot({ path: path.join(ARTIFACT_DIR, 'strategy_b_panel.png') });

  const stratC = await page.locator('#strategy-c');
  await stratC.screenshot({ path: path.join(ARTIFACT_DIR, 'strategy_c_poster.png') });

  const stratD = await page.locator('#strategy-d');
  await stratD.screenshot({ path: path.join(ARTIFACT_DIR, 'strategy_d_motion.png') });

  // Mobile Audit
  console.log('Capturing Mobile Behavior...');
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto(`http://localhost:${PORT}/audit-videos`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  const mobileAuditBlock = await mobilePage.locator('#video-audit');
  await mobileAuditBlock.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_mobile.png') });

  console.log('Done capturing screenshots. Closing browser.');
  await browser.close();
}

run().catch(console.error);
