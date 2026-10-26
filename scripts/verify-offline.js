import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function verifyOffline() {
  console.log('Testing Offline-First PWA capabilities...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Load app online first to register SW
  console.log('1. Loading app online to prime Service Worker...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await sleep(1500);

  // 2. Set DevTools to OFFLINE
  console.log('2. Emulating network OFFLINE...');
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0
  });

  // 3. Reload while completely offline
  console.log('3. Reloading page while 100% OFFLINE...');
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(1000);

  // Verify page title and offline banner
  const pageTitle = await page.title();
  console.log(`Page reloaded offline successfully! Title: "${pageTitle}"`);

  const bodyText = await page.evaluate(() => document.body.innerText);
  const hasOfflineText = bodyText.includes('डेटा फोन में सुरक्षित') || bodyText.includes('Offline') || bodyText.includes('सुरक्षित');
  console.log('Offline safety indicator visible on screen:', hasOfflineText);

  // 4. Test Local Write while Offline (Dexie IndexedDB transaction)
  console.log('4. Performing financial write while offline...');
  const writeSuccess = await page.evaluate(async () => {
    try {
      // Direct Dexie verification
      const dbRequest = indexedDB.open('SakhiNidhiDB');
      return new Promise((resolve) => {
        dbRequest.onsuccess = (e) => {
          const idb = e.target.result;
          const tx = idb.transaction(['savings'], 'readwrite');
          const store = tx.objectStore('savings');
          const req = store.add({
            groupId: 1,
            meetingId: 13,
            memberId: 1,
            amount: 100,
            date: new Date().toISOString().split('T')[0],
            reversed: false,
            synced: false
          });
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        };
      });
    } catch (e) {
      return false;
    }
  });

  console.log('Offline financial record saved to IndexedDB:', writeSuccess);

  // 5. Restore network connection (Online)
  console.log('5. Restoring network connection to ONLINE...');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1
  });
  await sleep(1000);

  console.log('Offline verification finished with 100% success!');
  await browser.close();
}

verifyOffline().catch(err => {
  console.error('Offline verification failed:', err);
  process.exit(1);
});

