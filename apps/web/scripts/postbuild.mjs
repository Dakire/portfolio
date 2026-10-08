// Étapes après `astro build` :
//  1. /sitemap.xml (URL historique, citée par robots.txt) : copie de l'index produit par @astrojs/sitemap ;
//  2. images de partage OpenGraph (1200 x 630) : une par article, dans dist/og/<slug>.png, rendue par Chromium (Playwright).
//     Sans Chromium, l'image générique /og-image.png est copiée à la place : l'URL existe toujours, le build ne casse jamais pour une image.
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const CACHE = '.cache/og';
const SIZE = { width: 1200, height: 630 };
const CATEGORIES = {
  fr: {
    messagerie: 'Messagerie',
    dns: 'DNS',
    migration: 'Migration',
    securite: 'Sécurité',
    'poste-de-travail': 'Poste de travail',
  },
  en: {
    messagerie: 'Email',
    dns: 'DNS',
    migration: 'Migration',
    securite: 'Security',
    'poste-de-travail': 'Workstation',
  },
};

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Champs du front matter (les valeurs textuelles sont des chaînes JSON entre guillemets, voir content.config.ts). */
function frontMatter(text) {
  const block = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const fields = {};
  for (const line of block.split('\n')) {
    const i = line.indexOf(':');
    const value = line.slice(i + 1).trim();
    fields[line.slice(0, i).trim()] = value.startsWith('"') ? JSON.parse(value) : value;
  }
  return fields;
}

async function articles() {
  const out = [];
  for (const [dir, lang] of [
    ['src/content/blog', 'fr'],
    ['src/content/blog/en', 'en'],
  ]) {
    for (const file of (await readdir(dir)).filter((f) => f.endsWith('.md'))) {
      const fm = frontMatter(await readFile(join(dir, file), 'utf-8'));
      out.push({
        slug: file.slice(0, -3),
        lang,
        title: fm.title,
        kicker: CATEGORIES[lang][fm.category] ?? 'Blog',
      });
    }
  }
  return out;
}

const titleSize = (title) => (title.length <= 42 ? 76 : title.length <= 72 ? 64 : 52);

const html = ({ title, kicker, lang }, fontUrl) => `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Inter Variable'; font-weight: 100 900; src: url(${fontUrl}) format('woff2-variations'); }
  * { box-sizing: border-box; margin: 0; }
  body { width: ${SIZE.width}px; height: ${SIZE.height}px; overflow: hidden; background: #0a0c0f; color: #eef1f6; position: relative;
    font-family: 'Inter Variable', system-ui, sans-serif; }
  .grid { position: absolute; inset: 0; background-image: linear-gradient(#262c38 1px, transparent 1px), linear-gradient(90deg, #262c38 1px, transparent 1px);
    background-size: 56px 56px; -webkit-mask-image: linear-gradient(to bottom, #000, transparent 80%); opacity: .7; }
  .frame { position: absolute; inset: 0; padding: 64px 76px; display: flex; flex-direction: column; justify-content: space-between; }
  .brand { font: 600 30px ui-monospace, 'Cascadia Mono', Menlo, monospace; }
  .brand b { color: #3ddc97; font-weight: 600; }
  .kicker { color: #3ddc97; font: 600 28px ui-monospace, 'Cascadia Mono', Menlo, monospace; margin-bottom: 22px; }
  h1 { font-size: ${titleSize(title)}px; line-height: 1.1; font-weight: 700; letter-spacing: -.025em; max-width: 1020px;
    display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .bar { height: 6px; width: 160px; border-radius: 6px; background: #3ddc97; }
</style></head><body>
  <div class="grid"></div>
  <div class="frame">
    <div class="brand"><b>~/</b>grichard<b>.eu</b></div>
    <div><p class="kicker">${esc(kicker)}</p><h1>${esc(title)}</h1></div>
    <div class="bar"></div>
  </div>
</body></html>`;

async function sitemap() {
  await copyFile(join(DIST, 'sitemap-index.xml'), join(DIST, 'sitemap.xml'));
}

async function ogImages() {
  const items = await articles();
  await mkdir(join(DIST, 'og'), { recursive: true });
  await mkdir(CACHE, { recursive: true });

  const fonts = (await readdir(join(DIST, '_astro'))).filter((f) =>
    /^inter-latin-wght-normal\..*\.woff2$/.test(f),
  );
  const fontUrl = fonts[0] ? `./_astro/${fonts[0]}` : '';
  const tmp = join(DIST, '.og-render.html');
  let browser;
  let generated = 0;
  let fallback = 0;
  try {
    for (const item of items) {
      const target = join(DIST, 'og', `${item.slug}.png`);
      const page = html(item, fontUrl);
      const cached = join(
        CACHE,
        `${createHash('sha1').update(page).digest('hex').slice(0, 16)}.png`,
      );
      try {
        await copyFile(cached, target);
      } catch {
        if (!browser) {
          const { chromium } = await import('@playwright/test');
          browser = await chromium.launch();
        }
        await writeFile(tmp, page);
        const tab = await browser.newPage({ viewport: SIZE });
        await tab.goto(new URL(tmp, `file:///${process.cwd().replace(/\\/g, '/')}/`).href);
        await tab.evaluate(() => document.fonts.ready);
        const png = await tab.screenshot({ type: 'png' });
        await tab.close();
        await writeFile(cached, png);
        await writeFile(target, png);
      }
      generated++;
    }
  } catch (error) {
    console.warn(
      `[og] Chromium indisponible (${String(error.message).split('\n')[0]}) : image générique utilisée. Installez-le : pnpm exec playwright install chromium`,
    );
    for (const item of items) {
      await copyFile(join(DIST, 'og-image.png'), join(DIST, 'og', `${item.slug}.png`));
      fallback++;
    }
  } finally {
    await browser?.close();
    await rm(tmp, { force: true });
  }
  console.log(
    `[postbuild] sitemap.xml, ${generated} images OG${fallback ? `, ${fallback} images génériques (repli)` : ''}`,
  );
}

await sitemap();
await ogImages();
