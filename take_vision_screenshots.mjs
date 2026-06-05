import { chromium } from 'playwright';
import path from 'path';

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const baseUrl = 'https://portfolio-creator-z0r7.onrender.com';
  console.log('Taking screenshots for A, B, C...');

  try {
    // Vision A
    await page.goto(`${baseUrl}/vision-a`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join('screenshots', 'vision_a_landing.png') });
    await page.mouse.move(720, 890);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join('screenshots', 'vision_a_queue.png') });

    // Vision B
    await page.goto(`${baseUrl}/vision-b`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join('screenshots', 'vision_b_landing.png') });

    // Vision C
    await page.goto(`${baseUrl}/vision-c`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join('screenshots', 'vision_c_landing.png') });

    console.log('Screenshots complete.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
