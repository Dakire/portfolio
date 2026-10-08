// Préproduction : le site est servi depuis un sous-dossier (/preprod/). Ce test construit réellement le site avec ce préfixe et
// vérifie qu'aucun lien interne n'y échappe (sinon la préproduction renverrait vers la production, ou vers des 404).
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const OUT = 'dist-preprod';
const BASE = '/preprod';

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? htmlFiles(path) : path.endsWith('.html') ? [path] : [];
  });
}

describe(`site construit avec SITE_BASE=${BASE}/`, () => {
  let pages: { file: string; html: string }[] = [];

  beforeAll(() => {
    rmSync(OUT, { recursive: true, force: true });
    // Vitest injecte BASE_URL, MODE, DEV… dans l'environnement : le build n'en veut pas (BASE_URL=/ écraserait le préfixe).
    const env = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) => !/^(VITEST|BASE_URL|MODE|DEV|PROD|SSR|TEST)/.test(key),
      ),
    );
    // Node directement, sans shell : un shell (Git Bash sous Windows) réécrirait « /preprod/ » en chemin de disque.
    execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', OUT], {
      env: {
        ...env,
        NODE_ENV: 'production',
        SITE_BASE: `${BASE}/`,
        PUBLIC_NOINDEX: '1',
        PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      },
      stdio: 'pipe',
    });
    pages = htmlFiles(OUT).map((file) => ({ file, html: readFileSync(file, 'utf-8') }));
  }, 180_000);

  it('produit les mêmes pages que la production', () => {
    expect(pages.length).toBeGreaterThan(80);
  });

  it('préfixe chaque lien, image, script et feuille de style internes', () => {
    const escaping: string[] = [];
    for (const { file, html } of pages) {
      for (const m of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
        const url = m[1]!;
        if (url.startsWith('//')) continue;
        if (url !== BASE && !url.startsWith(`${BASE}/`)) escaping.push(`${file} : ${url}`);
      }
    }
    expect(escaping).toEqual([]);
  });

  it('garde les URL canoniques sous le préfixe et interdit l’indexation', () => {
    for (const { file, html } of pages) {
      expect(html, file).toMatch(/<link rel="canonical" href="https:\/\/grichard\.eu\/preprod\//);
      expect(html, file).toContain('<meta name="robots" content="noindex, follow"');
      expect(html, file).toContain('data-base="/preprod"');
    }
  });

  it('préfixe aussi les liens internes écrits dans les articles', () => {
    const post = pages.find((p) => p.file.includes(join('blog', 'spf-dkim-dmarc-expliques')));
    expect(post).toBeDefined();
    expect(post!.html).not.toMatch(/href="\/(outils|blog|en)\//);
  });
});
