// Images de partage (Open Graph, 1200 x 630) générées au build : une par article, avec son titre.
// Rendu par Chromium (Playwright, déjà installé pour les tests). Si Chromium est absent, on avertit et les pages
// retombent sur l'image générique /og-image.png : le build ne casse jamais pour une image.
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { esc } from './markdown.js';
import { root } from './paths.js';

export const OG_SIZE = { width: 1200, height: 630 };
const CACHE_DIR = '.cache/og';

// Taille du titre selon sa longueur : un titre long reste lisible sans déborder
const titleSize = (title) => (title.length <= 42 ? 78 : title.length <= 72 ? 66 : 54);

export function ogHtml({ title, kicker, byline }) {
  const size = titleSize(title);
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${OG_SIZE.width}px; height: ${OG_SIZE.height}px; overflow: hidden; background: #020617; color: #fff;
    font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif; position: relative; }
  .glow { position: absolute; inset: 0;
    background: radial-gradient(760px 480px at 88% 4%, rgb(52 211 153 / .28), transparent 70%),
                radial-gradient(620px 440px at 4% 96%, rgb(34 211 238 / .2), transparent 70%); }
  .grid { position: absolute; inset: 0; background-image: linear-gradient(rgb(255 255 255 / .05) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .05) 1px, transparent 1px);
    background-size: 52px 52px; -webkit-mask-image: linear-gradient(to bottom, #000, transparent 85%); mask-image: linear-gradient(to bottom, #000, transparent 85%); }
  .frame { position: absolute; inset: 0; padding: 64px 76px; display: flex; flex-direction: column; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 16px; font: 700 26px ui-monospace, "Cascadia Mono", Menlo, monospace; letter-spacing: -.01em; }
  .tile { width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center; color: #34d399;
    background: rgb(52 211 153 / .14); border: 1px solid rgb(52 211 153 / .35); font-size: 24px; }
  .kicker { color: #6ee7b7; font: 600 28px ui-monospace, "Cascadia Mono", Menlo, monospace; margin-bottom: 22px; }
  h1 { font-size: ${size}px; line-height: 1.08; font-weight: 800; letter-spacing: -.02em; max-width: 1000px;
    display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .foot { display: flex; align-items: center; justify-content: space-between; color: #cbd5e1; font-size: 28px; }
  .bar { height: 6px; width: 180px; border-radius: 6px; background: linear-gradient(90deg, #34d399, #22d3ee); }
</style></head><body>
  <div class="glow"></div><div class="grid"></div>
  <div class="frame">
    <div class="brand"><span class="tile">&gt;_</span>GR_PORTFOLIO</div>
    <div><p class="kicker">${esc(kicker)}</p><h1>${esc(title)}</h1></div>
    <div class="foot"><span>${esc(byline)}</span><span class="bar"></span></div>
  </div>
</body></html>`;
}

/**
 * @param {{ key: string, title: string, kicker: string, byline: string }[]} items
 * @param {string} outDir  dossier de sortie (relatif à la racine du projet), un PNG par `key`
 * @returns {Promise<Set<string>>} les clés dont l'image a bien été produite
 */
export async function generateOgImages(items, outDir) {
  const done = new Set();
  let browser;
  try {
    await mkdir(root(CACHE_DIR), { recursive: true });
    await mkdir(root(outDir), { recursive: true });

    for (const item of items) {
      const html = ogHtml(item);
      const cached = root(`${CACHE_DIR}/${createHash('sha1').update(html).digest('hex').slice(0, 16)}.png`);
      const out = root(`${outDir}/${item.key}.png`);

      try {
        await copyFile(cached, out); // déjà produite par un build précédent
      } catch {
        if (!browser) {
          const { chromium } = await import('@playwright/test');
          browser = await chromium.launch();
        }
        const page = await browser.newPage({ viewport: OG_SIZE });
        await page.setContent(html, { waitUntil: 'load' });
        const png = await page.screenshot({ type: 'png' });
        await page.close();
        await writeFile(cached, png);
        await writeFile(out, png);
      }
      done.add(item.key);
    }
  } catch (error) {
    console.warn(`[og] Images de partage non générées (${error.message.split('\n')[0]}). Installez Chromium : npx playwright install chromium`);
  } finally {
    await browser?.close();
  }
  return done;
}

export const readPng = (path) => readFile(root(path));
