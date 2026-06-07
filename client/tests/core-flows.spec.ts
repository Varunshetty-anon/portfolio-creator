import { expect, test, type Page, type TestInfo } from '@playwright/test';

const password = 'Password123!';
const reelUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

async function attachBrowserDiagnostics(page: Page, testInfo: TestInfo) {
  const consoleMessages: string[] = [];
  const networkErrors: string[] = [];

  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });

  page.on('requestfailed', (request) => {
    networkErrors.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText}`);
  });

  return async () => {
    await testInfo.attach('console-errors.json', {
      body: JSON.stringify(consoleMessages, null, 2),
      contentType: 'application/json',
    });
    await testInfo.attach('network-errors.json', {
      body: JSON.stringify(networkErrors, null, 2),
      contentType: 'application/json',
    });

    const actionableConsole = consoleMessages.filter((message) => {
      return !message.includes('React Router Future Flag Warning');
    });

    const firstPartyNetworkErrors = networkErrors.filter((message) => {
      return message.includes('localhost:3000') || message.includes('localhost:5000');
    });

    expect(actionableConsole, 'console errors/warnings').toEqual([]);
    expect(firstPartyNetworkErrors, 'first-party network errors').toEqual([]);
  };
}

async function signUpAndOnboard(page: Page) {
  const id = Date.now();
  const user = {
    email: `frames-e2e-${id}@example.com`,
    name: 'Avery Motion',
    username: `frames-e2e-${id}`,
    role: 'Motion Designer',
  };

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Craft a portfolio/i })).toBeVisible();
  await page.getByRole('button', { name: 'Create Account' }).first().click();
  await page.getByRole('textbox', { name: 'Display Name' }).fill(user.name);
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.locator('form').getByRole('button', { name: 'Create Account' }).click();

  await page.waitForURL('**/onboarding');
  await expect(page.getByRole('heading', { name: "What's your name?" })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('textbox').fill(user.username);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: user.role }).click();
  await page.getByRole('button', { name: 'Create Portfolio' }).click();

  await page.waitForURL('**/editor');
  await expect(page.getByText('SAVED')).toBeVisible();

  return user;
}

test.describe('FRAMES core product flows', () => {
  test('registration, login, onboarding, project URL upload, publish, public portfolio, and playback', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Full editor workflow is covered on desktop.');
    const flushDiagnostics = await attachBrowserDiagnostics(page, testInfo);
    const user = await signUpAndOnboard(page);
    await testInfo.attach('01-editor-after-onboarding.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await context.clearCookies();
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Enter Studio' }).click();
    await page.waitForURL('**/editor');

    await page.getByRole('button', { name: 'Projects' }).click();
    await page.getByRole('button', { name: 'New Project' }).click();
    await page.getByRole('textbox', { name: 'Project Title' }).fill('Signal / Motion Reel');
    await page.getByRole('textbox', { name: 'Description (Optional)' }).fill('A focused edit built around rhythm, texture, and cinematic pacing.');
    await page.getByRole('button', { name: 'Paste Link' }).click();
    await page.getByRole('textbox', { name: 'YouTube, Vimeo, or direct link...' }).fill(reelUrl);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Brand Trailer • https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeVisible();

    await testInfo.attach('02-project-url-added.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await page.getByRole('button', { name: 'Identity' }).click();
    await page.getByRole('textbox', { name: 'SHOWREEL VIDEO URL' }).fill(reelUrl);
    await expect(page.getByText('SAVED')).toBeVisible();

    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Portfolio published.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Live' })).toBeVisible();

    await page.goto(`/portfolio/${user.username}`);
    await page.waitForTimeout(3200);
    await expect(page.getByRole('heading', { name: user.name }).last()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Video Player' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Signal / Motion Reel' })).toBeVisible();

    await testInfo.attach('03-public-portfolio.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await page.getByRole('button', { name: 'Open project: Signal / Motion Reel' }).click();
    await expect(page.getByRole('heading', { name: 'Signal / Motion Reel' }).last()).toBeVisible();

    await flushDiagnostics();
  });

  test('mobile public portfolio keeps video and project browsing accessible', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile coverage is scoped to the public portfolio.');
    const flushDiagnostics = await attachBrowserDiagnostics(page, testInfo);
    const user = await signUpAndOnboard(page);

    const updateResponse = await page.request.put('/api/v1/portfolio', {
      data: { showreelUrl: reelUrl, projects: [] },
    });
    expect(updateResponse.ok()).toBeTruthy();

    const publishResponse = await page.request.post('/api/v1/portfolio/publish');
    expect(publishResponse.ok()).toBeTruthy();

    await page.goto(`/portfolio/${user.username}`);
    await page.waitForTimeout(3200);
    await expect(page.getByRole('heading', { name: user.name }).last()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Video Player' })).toBeVisible();

    await testInfo.attach('04-mobile-public-portfolio.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await flushDiagnostics();
  });
});
