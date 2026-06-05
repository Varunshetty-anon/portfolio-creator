import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  // Record video of the session
  const context = await browser.newContext({
    recordVideo: {
      dir: 'screenshots/videos/',
      size: { width: 1920, height: 1080 }
    }
  });
  const page = await context.newPage();
  
  const baseUrl = 'https://frames-aivg.onrender.com';
  const routes = ['/vision-compare'];
  
  let report = '# Evidence Audit Report\n\n';

  for (const route of routes) {
    console.log(`Auditing ${route}...`);
    report += `## Route: ${route}\n`;
    
    const logs = [];
    const errors = [];
    
    page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', error => errors.push(error.message));

    let status = 0;
    try {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
      status = response?.status() || 0;
      report += `- **HTTP Status:** ${status}\n`;
      
      // Wait for iframes to load
      await page.waitForTimeout(5000); 
      
      // Interact a bit so video has something
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.mouse.move(960, 500);
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(2000);
      
      const fullPath = `screenshots${route.replace('/', '_')}_full.png`;
      await page.screenshot({ path: path.join('.', fullPath), fullPage: true });
      report += `- **Full Screenshot:** Saved to ${fullPath}\n`;
      
      // Check if "404" is visible
      const bodyText = await page.textContent('body');
      if (bodyText && bodyText.includes('404')) {
         report += `**WARNING:** The page body contains "404".\n`;
      }

    } catch (e) {
      report += `- **Navigation Error:** ${e.message}\n`;
    }
    
    report += '\n---\n\n';
    
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
  }

  await context.close(); // Important to save video
  await browser.close();
  
  // Find the generated video file
  const videoFiles = fs.readdirSync('screenshots/videos/');
  if (videoFiles.length > 0) {
    fs.renameSync(`screenshots/videos/${videoFiles[0]}`, 'screenshots/vision_compare_walkthrough.webm');
    report += `- **Video Walkthrough:** Saved to screenshots/vision_compare_walkthrough.webm\n`;
  }

  fs.writeFileSync('audit_report.md', report);
  console.log('Audit complete.');
}

takeScreenshots();
