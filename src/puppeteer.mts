import express from 'express'
import { writeFileSync } from 'fs';
import { resolve } from 'path'
import { launch, Browser, PuppeteerLaunchOptions } from 'puppeteer'
import { ensureDirExists, getValidatedFileName, target } from './utils.mjs';

interface gotoOptions {
  timeout : number
}

interface engine_options {
  launchOptions : PuppeteerLaunchOptions
  gotoOptions: gotoOptions
}

interface puppeteer_options {
  port : number
  engine : engine_options
}

const puppeteer_options : puppeteer_options = {
  port: 3000,
  engine: {
    launchOptions: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      product: "chrome",
      headless: true,
      ignoreHTTPSErrors: true
    },
    gotoOptions: {
      timeout: 0
    }
  }
}

/**
 * @param {number} port
 * @param {string} routes
 * @param {string} dir
 * @returns {string|boolean}
 */
async function runStaticServer(port : number, routes : string[], dir : string) {
  try {
    const app = express();
    const resolvedPath = resolve(dir);
    app.use(express.static(resolvedPath));
    routes.forEach(route => {
      app.get(route, (req : any, res : any) => {
        res.sendFile(`${resolvedPath}/index.html`);
      })
    })

    await app.listen(port);
    return `http://localhost:${port}`;
  } catch(err) {
    throw new Error(`Error: Failed to run puppeteer server on port ${port}.\nMessage: ${err}`);
  }
}

/**
 *
 * @param {string} route
 * @param {string} html
 * @param {string} dir
 */
async function createNewHTMLPage(route : string, html : string | NodeJS.ArrayBufferView, dir : string) {
  try {
    if (route.indexOf('/') !== route.lastIndexOf('/')) {
      const subDir = route.slice(0, route.lastIndexOf('/'));
      await ensureDirExists(`${dir}${subDir}`);
    }

    const fileName = getValidatedFileName(route);

    await writeFileSync(`${dir}${fileName}`, html, {encoding: 'utf-8', flag: 'w'});
    //console.log(`Created ${fileName}`);
  } catch (err) {
    throw new Error(`Error: Failed to create HTML page for ${route}.\nMessage: ${err}`);
  }
}

/**
 * @param {object} browser
 * @param {string} pageUrl
 * @param {object} options
 * @returns {string|number}
 */
async function getHTMLfromPuppeteerPage(browser : Browser, pageUrl : string) {
  try {
    const page = await browser.newPage();

    await page.goto(pageUrl, {waitUntil: 'networkidle0'}/*Object.assign({waitUntil: 'networkidle0'}, options)*/);

    const html = await page.evaluate(() => {
      for (const script of document.body.querySelectorAll('script')) script.remove();
      return '<!DOCTYPE html><html lang="en">' + document.getElementsByTagName('html')[0].innerHTML + '</html>';
    });
    if (!html) return 0;

    return html;
  } catch(err) {
    throw new Error(`Error: Failed to build HTML for ${pageUrl}.\nMessage: ${err}`);
  }
}

/**
 * @param {string} baseUrl
 * @param {string[]} routes
 * @param {string} dir
 * @param {object} engine
 * @returns {number|undefined}
 */
async function run(baseUrl : string, routes : string[], dir : string, engine : engine_options) {
  const browser = await launch(engine.launchOptions);
  for (let i = 0; i < routes.length; i++) {
    try {
      //console.log(`Processing route "${routes[i]}"`);
      const html = await getHTMLfromPuppeteerPage(browser, `${baseUrl}${routes[i]}`);
      if (html) createNewHTMLPage(routes[i], html, dir);
      else return 0;
    } catch (err) {
      throw new Error(`Error: Failed to process route "${routes[i]}"\nMessage: ${err}`);
    }
  }

  await browser.close();
  return;
}

export async function runPuppeteer(routes : string[], builddir : string) {
  const options = puppeteer_options
  const staticServerURL = await runStaticServer(options.port, routes, builddir);

  if (!staticServerURL) return 0;

  await run(staticServerURL, routes, builddir, options.engine);
  process.exit();
}