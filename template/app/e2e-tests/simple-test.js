const { chromium } = require('@playwright/test');

async function runSimpleTest() {
  console.log('Starting simple test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());
    
    // Check if the page loaded successfully
    const title = await page.title();
    if (title.includes('Postmarkr') || title.includes('OpenSaaS')) {
      console.log('✅ Test passed: Page loaded successfully');
    } else {
      console.log('❌ Test failed: Page title does not contain expected text');
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

runSimpleTest();
