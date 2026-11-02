// Usage: node shoot.js <page.html> <outDir> [--actions=actions.js] [--dark] [--wait=1500] [--only=desktop|phone]
// Wraps the artifact page with the publish skeleton, serves pinned CDN libs from local copies,
// takes screenshots at desktop (1440x900) and phone (390x844), and reports errors + horizontal overflow.
// actions.js: module.exports = async (page, shot, vp) => { ... await shot('name') ... }  (vp = 'desktop' | 'phone')
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const args = process.argv.slice(2);
const file = path.resolve(args[0]); const out = path.resolve(args[1] || '.');
const opt = Object.fromEntries(args.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
fs.mkdirSync(out, { recursive: true });
const VENDOR = path.join(__dirname, 'vendor');
const wrapped = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n${fs.readFileSync(file, 'utf8')}\n</body></html>`;
const tmp = path.join(out, '_wrapped.html'); fs.writeFileSync(tmp, wrapped);
function vendorFor(url) {
  if (/three(@|\/|\.js\/r?)0?\.?149/.test(url) && /three\.min\.js/.test(url)) return path.join(VENDOR, 'three-0.149.0.min.js');
  const g = url.match(/gsap(?:@|\/)3\.12\.5\/(?:dist\/)?([A-Za-z]+)\.min\.js/);
  if (g) return path.join(VENDOR, g[1] + '.min.js');
  return null;
}
(async () => {
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY || 'http://127.0.0.1:35561' }, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const vps = [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]].filter(([n]) => !opt.only || opt.only === n);
  for (const [name, viewport] of vps) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: opt.dark ? 'dark' : 'light', hasTouch: name === 'phone', isMobile: name === 'phone' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`[${m.type()}] ${m.text()}`); });
    page.on('pageerror', e => errs.push(`[pageerror] ${e.message}`));
    page.on('requestfailed', r => errs.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));
    await page.route(/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com/, async route => {
      const local = vendorFor(route.request().url());
      if (local && fs.existsSync(local)) return route.fulfill({ path: local, contentType: 'application/javascript' });
      errs.push(`[no-local-copy] ${route.request().url()} (CDN unreachable from sandbox; only three@0.149.0 build/three.min.js and gsap@3.12.5 dist/*.min.js are mirrored)`);
      return route.abort();
    });
    await page.goto('file://' + tmp, { waitUntil: 'load' });
    try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
    await page.waitForTimeout(+opt.wait || 1500);
    const shot = async (label, o = {}) => { const p = path.join(out, `${name}-${label}.png`); await page.screenshot({ path: p, ...o }); console.log('shot', p); };
    await shot('initial');
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, sh: document.documentElement.scrollHeight, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((v, i, a) => a.indexOf(v) === i) }));
    console.log(`[${name}] scrollWidth=${m.sw} innerWidth=${m.iw} ${m.sw > m.iw ? 'HORIZONTAL OVERFLOW!' : 'no h-overflow'} scrollHeight=${m.sh} fontsLoaded=${m.fonts.join(', ')}`);
    if (opt.full) await shot('full', { fullPage: true });
    if (opt.actions) { try { await require(path.resolve(opt.actions))(page, shot, name); } catch (e) { errs.push('[actions] ' + e.stack); } }
    console.log(`[${name}] errors/warnings (${errs.length}):\n` + errs.map(e => '  ' + e).join('\n'));
    await ctx.close();
  }
  await browser.close();
})();
