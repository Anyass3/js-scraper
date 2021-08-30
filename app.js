import express from 'express';
import colors from 'colors';
import axios from 'axios';
import xml2js from 'xml2js';
import { new_page, get_context } from './utils.js';

const app = express();
const port = process.env.PORT || 8080;

let session = {};
let timeoutId;

const tick = () => {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    console.log('browser is idle --> closing');
    closeSession();
  }, 1800000); //30 mins
};

const getPage = async (media) => {
  let { browser } = session;
  if (!browser) {
    browser = await startSession();
  }
  let page;
  try {
    if (session.isConnected()) page = await new_page(browser, media);
    else {
      browser = await startSession();
      page = await new_page(browser, media);
    }
  } catch (error) {
    browser = await startSession();
    page = await new_page(browser, media);
  }

  const rv = Math.floor(Math.random() * 100);
  const user_agent = `Mozilla/5.0 (Windows NT 10.0; rv:${rv}.0) Gecko/${Math.floor(
    Math.random() * 10 ** 7
  )} Firefox/${rv}.0`;
  await page.setUserAgent(user_agent);

  if (!media)
    await page.setViewport({
      width: 1024 + Math.floor(Math.random() * 1000),
      height: 768 + Math.floor(Math.random() * 1000),
    });
  return page;
};

const startSession = async () => {
  session = await get_context();
  console.log(colors.dim('starting new browser session'));
  return session.browser;
};
const closeSession = async () => {
  await session.close?.();
};

const parseUrl = function (url) {
  url = decodeURIComponent(url);
  if (!/^(?:f|ht)tps?:\/\//.test(url)) {
    url = 'http://' + url;
  }
  return url;
};

app.get('/', async function (req, res) {
  tick();
  const url = parseUrl(req.query.url || 'www.google.com');
  const waitUntil = req.query.waitUntil || 'domcontentloaded';
  const rtype = req.query.res;

  const page = await getPage(rtype === 'screenshot');
  console.log(colors.blue('\nFetching::' + url));
  let fetched = false;
  let retry = 0;
  while (fetched === false) {
    try {
      await page.goto(url, { waitUntil });
      fetched = true;
      console.log(colors.green('success'), waitUntil);
    } catch (err) {
      console.log(colors.red('retrying::', err.message));
      console.log(err.name);
      retry++;
      if (retry > 10 || err.message.includes('Session closed')) break;
    }
  }

  try {
    if (rtype === 'screenshot') {
      console.log(colors.green('screenshot'));
      await page.screenshot().then(function (buffer) {
        res.setHeader('Content-Disposition', 'attachment;filename="' + url + '.png"');
        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);
      });
    } else {
      const htmlContent = await page.content();
      res.send(htmlContent);
    }
    page.close();
  } catch (error) {
    console.log(colors.red('error::' + error.message));
    res.status(404).send(error.message);
  }
});
app.get('/start', (req, res) => {
  tick();
  startSession();
  res.send('Browser Active');
});

app.get('/close', (req, res) => {
  tick();
  closeSession();
  res.send('Browser Inactive');
});
app.get('/sitemap', async (req, res) => {
  tick();
  const url = req.query.url;
  console.log('/sitemap', url);
  try {
    console.log('fetching sitemap');
    const { data } = await axios.get(url);
    console.log('parsing sitemap');
    const parser = new xml2js.Parser(/* options */);
    const result = await parser.parseStringPromise(data);
    res.send(result.urlset.url.map((url) => url.loc[0]));
  } catch (error) {
    console.log(colors.red('error::' + error.message));
    res.status(404).send(error.message);
  }
});

app.listen(port, function () {
  console.log('App listening on port ' + port);
});
