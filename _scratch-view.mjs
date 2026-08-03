// Log in as the fixture client and screenshot the three surfaces.
import { chromium } from '@playwright/test';
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(30000);
await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
await page.fill('input[name=email]', 'view@fixture.local');
await page.fill('input[name=password]', 'view-fixture-1');
await page.click('button[type=submit]');
await page.waitForURL(/portal|welcome/, { timeout: 30000 });
await page.goto('http://localhost:3000/portal', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${out}/portal.png`, fullPage: true });
await page.goto('http://localhost:3000/portal/forwarding', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${out}/forwarding.png`, fullPage: true });
// carrier steps view
const sel = page.locator('select#carrierKey');
if (await sel.count()) {
  await sel.selectOption('mobile_gsm');
  await page.locator('input[name=mode][value=self_serve]').check();
  await page.click('button[type=submit]');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${out}/forwarding-steps.png`, fullPage: true });
}
await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${out}/signup.png`, fullPage: true });
console.log('done');
await browser.close();
