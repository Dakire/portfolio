// PDF des CV produits au build à partir de public/cv-fr.html et public/cv-en.html (Chromium, impression A4).
// Les sources chargent Tailwind, la police Inter et Lucide depuis des CDN : le rendu n'est accepté que si ces ressources
// ont bien chargé. Sinon (hors ligne, CDN indisponible) on garde les PDF déjà présents dans public/ et on avertit.
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { root } from './paths.js';

const CACHE_DIR = '.cache/cv';

/** Un PDF valide commence par %PDF et n'est pas vide : garde-fou contre une page blanche ou une erreur de rendu. */
export const looksLikePdf = (buffer) => buffer.length > 20_000 && buffer.subarray(0, 5).toString('latin1') === '%PDF-';

/** Nombre de pages d'un PDF (comptage des objets /Type /Page, sans dépendance). */
export const pageCount = (buffer) => (buffer.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;

/**
 * @param {{ source: string, out: string }[]} jobs  chemins relatifs à la racine du projet
 * @returns {Promise<{ out: string, status: 'generated' | 'cached' | 'kept', pages?: number }[]>}
 */
export async function generateCvPdfs(jobs) {
  const results = [];
  let browser;
  try {
    await mkdir(root(CACHE_DIR), { recursive: true });
    for (const job of jobs) {
      const html = await readFile(root(job.source));
      const cached = root(`${CACHE_DIR}/${createHash('sha1').update(html).digest('hex').slice(0, 16)}.pdf`);

      try {
        await copyFile(cached, root(job.out));
        results.push({ out: job.out, status: 'cached', pages: pageCount(await readFile(cached)) });
        continue;
      } catch {
        // pas encore en cache : on le produit
      }

      try {
        if (!browser) {
          const { chromium } = await import('@playwright/test');
          browser = await chromium.launch();
        }
        const page = await browser.newPage();
        await page.emulateMedia({ media: 'print' });
        await page.goto(root(job.source).href, { waitUntil: 'networkidle', timeout: 30_000 });
        // Les CDN ont-ils répondu ? (Tailwind défini, icônes Lucide rendues, police Inter chargée)
        await page.waitForFunction(() => typeof window.tailwind !== 'undefined' && !document.querySelector('i[data-lucide]'), null, { timeout: 10_000 });
        await page.evaluate(() => document.fonts.ready);
        const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
        await page.close();
        if (!looksLikePdf(pdf)) throw new Error('PDF vide ou invalide');

        await writeFile(cached, pdf);
        await writeFile(root(job.out), pdf);
        results.push({ out: job.out, status: 'generated', pages: pageCount(pdf) });
      } catch (error) {
        console.warn(`[pdf] ${job.source} : PDF non régénéré (${error.message.split('\n')[0]}). Le PDF de public/ est conservé.`);
        results.push({ out: job.out, status: 'kept' });
      }
    }
  } finally {
    await browser?.close();
  }
  return results;
}
