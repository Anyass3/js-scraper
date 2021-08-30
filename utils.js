import puppeteer from 'puppeteer';
// import puppeteer from 'puppeteer-core';
import colors from 'colors';

const blacklist = [
  'quantummetric',
  'collector',
  'robots',
  '16uD0kOF',
  'ads-twitter',
  'googleads',
  '/ads/',
  'analytics',
  'googletagmanager',
  'connect.facebook.net',
  'scevent',
  'bat.bing',
  'next-integrations',
  'riskified',
  'pdst.fm',
  'impactradius-event.com',
  'tags.w55c',
  'bugsnag',
  'doubleclick',
  'mparticle',
];

export const get_context = async () => {
  console.log('launching browser');
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // executablePath: '/snap/bin/chromium',
    // headless: false,
  });

  const context = await browser.createIncognitoBrowserContext();

  const close = async () => {
    console.log(colors.cyan('closing browser'));
    try {
      await context.close();
    } catch (error) {
      console.log(colors.red(error.message));
    }
    try {
      await browser.close();
    } catch (error) {
      console.log(colors.red(error.message));
    }
  };
  return { close, browser: context, isConnected: () => browser.isConnected() };
};

export const new_page = async (context, media = false) => {
  const page = await context.newPage();

  page.on('request', async (req) => {
    const url = req.url();

    const shouldAbort =
      (!media && ['stylesheet', 'font', 'image'].includes(req.resourceType())) ||
      blacklist.some((bl) => url.includes(bl));

    if (shouldAbort) {
      req.abort();
    } else req.continue();
  });
  await page.setRequestInterception(true);
  await page.setJavaScriptEnabled(true);
  return page;
};
