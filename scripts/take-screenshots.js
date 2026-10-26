import puppeteer from 'puppeteer-core';

const SCREENSHOT_DIR = 'C:/Users/Sourav/.gemini/antigravity/brain/a57efd35-df2a-463a-a1e9-28c66596f179/screenshots';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('Launching Edge browser...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Visit base page
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await sleep(1000);

  // If on onboarding screen, click "Load Demo Data"
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Load Demo Data')) {
      console.log('Clicking Load Demo Data...');
      await b.click();
      await sleep(1500);
      break;
    }
  }

  // Dismiss tutorial if present
  const allBtns = await page.$$('button');
  for (const b of allBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && (text.includes('छोड़ें') || text.includes('Skip') || text.includes('Get Started'))) {
      console.log('Dismissing tutorial modal...');
      await b.click();
      await sleep(600);
      break;
    }
  }

  const viewports = [
    { name: '360', width: 360, height: 740, isMobile: true },
    { name: '768', width: 768, height: 1024, isMobile: true },
    { name: '1440', width: 1440, height: 900, isMobile: false }
  ];

  const pagesToTest = [
    { tab: 'home', filePrefix: 'home' },
    { tab: 'meeting', filePrefix: 'savings' },
    { tab: 'loans', filePrefix: 'loans' },
    { tab: 'reports', filePrefix: 'reports' },
    { tab: 'bank', filePrefix: 'bank' },
    { tab: 'download', filePrefix: 'download' }
  ];

  for (const vp of viewports) {
    console.log(`Setting viewport: ${vp.width}x${vp.height}`);
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      isMobile: vp.isMobile
    });

    for (const p of pagesToTest) {
      if (p.tab === 'bank') {
        await page.goto('http://localhost:4173/bank/1', { waitUntil: 'networkidle0' });
      } else if (p.tab === 'download') {
        await page.goto('http://localhost:4173/download', { waitUntil: 'networkidle0' });
      } else {
        await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
        await sleep(500);
        // Find nav button
        const currentButtons = await page.$$('button');
        for (const b of currentButtons) {
          const text = await page.evaluate(el => el.textContent, b);
          if (p.tab === 'meeting' && text && (text.includes('बैठक') || text.includes('Meeting'))) {
            await page.evaluate(el => el.click(), b);
            break;
          } else if (p.tab === 'loans' && text && (text.includes('ऋण') || text.includes('Loans'))) {
            await page.evaluate(el => el.click(), b);
            break;
          } else if (p.tab === 'reports' && text && (text.includes('रिपोर्ट') || text.includes('Reports'))) {
            await page.evaluate(el => el.click(), b);
            break;
          }
        }
      }

      await sleep(600);
      const outPath = `${SCREENSHOT_DIR}/${p.filePrefix}_${vp.name}.png`;
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`Saved screenshot: ${outPath}`);
    }
  }

  await browser.close();
  console.log('All screenshots completed successfully!');
}

run().catch(err => {
  console.error('Error running screenshots:', err);
  process.exit(1);
});
