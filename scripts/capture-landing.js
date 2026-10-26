import puppeteer from 'puppeteer-core';

const SCREENSHOT_DIR = 'C:/Users/Sourav/.gemini/antigravity/brain/a57efd35-df2a-463a-a1e9-28c66596f179/screenshots';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Capture Project Website Landing Page on Desktop (1440px)
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle0' });
  await sleep(600);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/landing_page_1440.png`, fullPage: false });
  console.log('Saved landing_page_1440.png');

  // 2. Capture Project Website Landing Page on Mobile (360px)
  await page.setViewport({ width: 360, height: 780, isMobile: true, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle0' });
  await sleep(600);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/landing_page_360.png`, fullPage: false });
  console.log('Saved landing_page_360.png');

  // 3. Capture Elevated Home on Mobile (360px)
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await sleep(600);

  // If onboarding is shown, load demo data
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Load Demo Data')) {
      await page.evaluate(el => el.click(), b);
      await sleep(1000);
      break;
    }
  }

  // Dismiss tutorial if any
  const skipBtns = await page.$$('button');
  for (const b of skipBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && (text.includes('छोड़ें') || text.includes('Skip') || text.includes('Get Started'))) {
      await page.evaluate(el => el.click(), b);
      await sleep(400);
      break;
    }
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/home_elevated_360.png`, fullPage: false });
  console.log('Saved home_elevated_360.png');

  // 4. Capture Download Page with valid APK info
  await page.goto('http://localhost:5173/download', { waitUntil: 'networkidle0' });
  await sleep(600);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/download_elevated_360.png`, fullPage: false });
  console.log('Saved download_elevated_360.png');

  await browser.close();
  console.log('Done!');
}

run().catch(console.error);

