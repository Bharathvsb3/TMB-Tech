// Daily AdSense check for tmbtech.in (run by .github/workflows/adsense-check.yml).
// 1. ads.txt is live and carries the publisher line.
// 2. every content page still has the AdSense script in its <head>.
// 2b. policy guard: enough real text per ad unit (AdSense rejects or limits pages that are mostly ads). Warnings only: they never fail the run.
// 3. a real browser (phone and desktop size) loads the home page and the Ads page, waits, and reads the status Google writes on every ad slot:
//    <ins class="adsbygoogle" data-ad-status="filled|unfilled">. "filled" = an ad was really served.
// Output: a report in the job summary. Exit code 1 only when the setup is BROKEN (ads.txt / script missing). "No ad yet" is not a failure.
// It writes `filled=true|false` to GITHUB_OUTPUT so the workflow can open one issue the first time ads show up.
import { chromium } from 'playwright';
import { appendFileSync } from 'node:fs';

const SITE = 'https://tmbtech.in';
const PUB = 'pub-9329737502568531';
// Content pages only (the redirect stubs and the private client page do not carry AdSense).
const PAGES = ['/', '/ads/', '/privacy-policy/', '/founder/', '/sharkpanda/', '/bikeshop/', '/customer-order-entry/', '/jb-catalogue/', '/jb-one/', '/ledgo-erp/', '/gasone/'];

const lines = [];
const say = (s) => { console.log(s); lines.push(s); };
let broken = false;

// 1. ads.txt
try {
  const r = await fetch(`${SITE}/ads.txt`, { redirect: 'follow' });
  const t = await r.text();
  const ok = r.ok && t.includes(PUB) && t.toLowerCase().includes('google.com');
  say(`- ads.txt: ${r.status} ${ok ? 'OK' : 'PROBLEM (publisher line missing)'}`);
  if (!ok) broken = true;
} catch (e) {
  say(`- ads.txt: could not be fetched (${e.message})`);
  broken = true;
}

// 2. the script on every content page, and 2b. the amount of text per ad unit
const words = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<ins[\s\S]*?<\/ins>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .split(/\s+/)
  .filter((w) => w.length > 1).length;

let warned = 0;
const guard = [];
for (const p of PAGES) {
  try {
    const r = await fetch(SITE + p, { redirect: 'follow' });
    const t = await r.text();
    const has = t.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js') && t.includes(PUB.replace('pub-', 'ca-pub-'));
    say(`- ${p}: ${r.status} ${has ? 'script present' : 'SCRIPT MISSING'}`);
    if (!has) broken = true;
    const units = (t.match(/<ins[^>]+class="adsbygoogle"/gi) || []).length;
    const w = words(t);
    const ratio = units ? Math.round(w / units) : null;
    const low = units > 0 && (ratio < 150 || (units > 3 && w < 600));
    if (low) warned++;
    guard.push(`- ${p}: ${w} words, ${units} manual ad unit(s)${units ? `, ${ratio} words per unit` : ''}${low ? '  WARNING: too many ads for the amount of text' : ''}`);
  } catch (e) {
    say(`- ${p}: ${e.message}`);
  }
}
say('');
say('Text per ad unit (a page needs real text around its ads):');
for (const g of guard) say(g);
if (warned) say(`**${warned} page(s) have little text for their ads: add text or remove units before AdSense reviews the site (this is a warning only).**`);

// 3. a real browser
let filled = 0;
let unfilled = 0;
let slots = 0;
const browser = await chromium.launch();
for (const [name, ctxOpts] of [
  ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' }],
  ['desktop', { viewport: { width: 1366, height: 900 } }],
]) {
  const ctx = await browser.newContext(ctxOpts);
  for (const path of ['/', '/ads/']) {
    const page = await ctx.newPage();
    try {
      await page.goto(SITE + path, { waitUntil: 'load', timeout: 60000 });
      // Auto ads place their slots while the person scrolls: scroll down and give Google time
      for (let i = 0; i < 8; i++) {
        await page.mouse.wheel(0, 900);
        await page.waitForTimeout(1200);
      }
      await page.waitForTimeout(8000);
      const r = await page.evaluate(() => [...document.querySelectorAll('ins.adsbygoogle')].map((e) => e.getAttribute('data-ad-status') || 'pending'));
      const f = r.filter((s) => s === 'filled').length;
      const u = r.filter((s) => s === 'unfilled').length;
      slots += r.length;
      filled += f;
      unfilled += u;
      say(`- browser (${name}) ${path}: ${r.length} ad slot(s), filled ${f}, unfilled ${u}, pending ${r.length - f - u}`);
    } catch (e) {
      say(`- browser (${name}) ${path}: ${e.message}`);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();

say('');
say(filled > 0 ? '**ADS ARE SHOWING (filled slots found).**' : slots > 0 ? 'Slots exist but no ad is served yet (normal while the site is still "Getting ready" in AdSense).' : 'No ad slots created yet (AdSense has not approved the site or has not placed ads yet).');

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## AdSense check\n' + lines.join('\n') + '\n');
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `filled=${filled > 0}\nbroken=${broken}\n`);
process.exit(broken ? 1 : 0);
