// Intégrité du site construit (dist/) : à lancer après `pnpm build`. Détecte liens cassés, hreflang non réciproques, balisage invalide.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIST = join(process.cwd(), 'dist');
const SITE = 'https://grichard.eu';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const pages = walk(DIST)
  .filter((f) => f.endsWith('.html') && !f.includes(`${join('dist', 'design')}`))
  .map((file) => ({
    file,
    url:
      '/' +
      relative(DIST, file)
        .replace(/\\/g, '/')
        .replace(/index\.html$/, ''),
    html: readFileSync(file, 'utf-8'),
  }));

/** Chemin de fichier dans dist/ pour une URL du site (ou undefined si elle sort du site). */
function resolveTarget(href: string, from: string): string | undefined {
  if (/^(mailto:|tel:|#|javascript:)/.test(href)) return undefined;
  let target: URL;
  try {
    target = new URL(href, SITE + from);
  } catch {
    return undefined;
  }
  if (target.origin !== SITE) return undefined; // externe (comparaison d'origine, pas de préfixe : grichard.eu.exemple.org est externe)
  const abs = target.pathname;
  const path = join(DIST, decodeURIComponent(abs));
  return abs.endsWith('/') ? join(path, 'index.html') : path;
}

const attr = (html: string, re: RegExp) =>
  [...html.matchAll(new RegExp(re.source, 'g'))].map((m) => m[1]!);

/** Pages prévues dans une phase suivante (outils : phase 3). Vider cette liste quand elles existent. */
const PENDING = ['/outils/', '/en/tools/'];

describe('site construit', () => {
  it('contient des pages', () => {
    expect(pages.length).toBeGreaterThan(40);
  });

  describe.each(pages)('$url', ({ url, html }) => {
    it('a une langue, un titre, une description et une URL canonique absolue', () => {
      expect(html).toMatch(/<html lang="(fr|en)"/);
      expect(attr(html, /<title>([^<]+)<\/title>/)).toHaveLength(1);
      expect(attr(html, /<meta name="description" content="([^"]{40,320})"/)).toHaveLength(1);
      expect(attr(html, /<link rel="canonical" href="([^"]+)"/)[0]).toMatch(
        /^https:\/\/grichard\.eu\//,
      );
    });

    it('a exactement un h1', () => {
      expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    });

    it('ne contient ni <style> ni script en ligne (hors JSON-LD), ni gestionnaire on*', () => {
      expect(html).not.toMatch(/<style[\s>]/i);
      const scripts = [...html.matchAll(/<script([^>]*)>/gi)].map((m) => m[1]!);
      for (const s of scripts)
        expect(s, `script: ${s}`).toMatch(/src="|type="application\/ld\+json"/);
      expect(html).not.toMatch(/\son[a-z]+="/i);
    });

    it('ne pointe vers aucun fichier interne absent', () => {
      const refs = [
        ...attr(html, /\s(?:href|src)="([^"]+)"/g),
        ...attr(html, /<meta property="og:image" content="([^"]+)"/g),
      ];
      const missing = refs
        .filter((r) => !PENDING.some((p) => r.replace(SITE, '').startsWith(p)))
        .map((r) => ({ r, t: resolveTarget(r, url) }))
        .filter(({ t }) => t && !existsSync(t))
        .map(({ r }) => r);
      expect(missing).toEqual([]);
    });
  });

  it('les hreflang sont réciproques', () => {
    const hreflangs = new Map<string, Map<string, string>>();
    for (const { url, html } of pages) {
      const alts = new Map<string, string>();
      for (const m of html.matchAll(/<link rel="alternate" hreflang="([a-z-]+)" href="([^"]+)"/g))
        alts.set(m[1]!, m[2]!.replace(SITE, ''));
      if (alts.size) hreflangs.set(url, alts);
    }
    for (const [url, alts] of hreflangs) {
      for (const [lang, target] of alts) {
        if (lang === 'x-default') continue;
        const back = hreflangs.get(target);
        expect(back, `${url} -> ${target} (${lang}) sans retour`).toBeDefined();
        expect([...back!.values()], `${target} ne renvoie pas vers ${url}`).toContain(url);
      }
    }
  });

  it('les titres sont uniques', () => {
    const titles = pages
      .filter((p) => p.url !== '/404.html')
      .map((p) => attr(p.html, /<title>([^<]+)<\/title>/)[0]);
    expect(titles.length - new Set(titles).size).toBe(0);
  });

  it('le sitemap ne liste que des pages existantes et pas de page noindex', () => {
    const xml = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf-8');
    const locs = attr(xml, /<loc>([^<]+)<\/loc>/g);
    expect(locs.length).toBeGreaterThan(30);
    for (const loc of locs) {
      const target = resolveTarget(loc, '/')!;
      expect(existsSync(target), loc).toBe(true);
      expect(readFileSync(target, 'utf-8'), loc).not.toContain('noindex');
    }
  });

  it('ai-catalog.json est un JSON valide et les PDF du CV existent', () => {
    const catalog = JSON.parse(readFileSync(join(DIST, '.well-known', 'ai-catalog.json'), 'utf-8'));
    for (const entry of catalog.entries)
      expect(existsSync(resolveTarget(entry.url, '/')!), entry.url).toBe(true);
  });
});
