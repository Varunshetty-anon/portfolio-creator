import { chromium } from 'playwright';
import path from 'path';
import fetch from 'node-fetch';
import fs from 'fs';

const URL = 'http://localhost:3001/audit-videos';
const ARTIFACT_DIR = 'C:/Users/varun/.gemini/antigravity/brain/58fc36df-1457-405d-b3fc-84f841967157/';

async function waitForServer(url) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log('Local Server is ready!');
        return true;
      }
    } catch (e) {
      console.log('Waiting for local deployment...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return false;
}

async function run() {
  const isReady = await waitForServer(URL);
  if (!isReady) {
    console.error('Server is not ready at ' + URL);
    process.exit(1);
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Capture console logs
  const logStream = fs.createWriteStream(path.join(ARTIFACT_DIR, 'browser_console.log'), { flags: 'w' });
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}\n`;
    console.log(text);
    logStream.write(text);
  });
  page.on('pageerror', exception => {
    const text = `[error] ${exception}\n`;
    console.log(text);
    logStream.write(text);
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  
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

  const stratE = await page.locator('#strategy-e');
  await stratE.screenshot({ path: path.join(ARTIFACT_DIR, 'strategy_e_intro.png') });

  // Mobile Audit
  console.log('Capturing Mobile Behavior...');
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto(URL, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  const mobileAuditBlock = await mobilePage.locator('#video-audit');
  await mobileAuditBlock.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_mobile.png') });

  console.log('Done capturing screenshots. Closing browser.');
  await browser.close();
}

run().catch(console.error);
