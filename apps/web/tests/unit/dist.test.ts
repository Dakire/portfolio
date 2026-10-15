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
const PENDING: string[] = [];

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

    it('ne contient ni <style>, ni gestionnaire on*, ni script en ligne autre que le démarrage des îlots Astro', () => {
      // Seule feuille en ligne tolérée : la règle d'affichage des îlots Astro (autorisée par son empreinte dans la CSP).
      for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
        expect(m[1], 'feuille de style en ligne inattendue').toMatch(/^astro-island/);
      expect(html).not.toMatch(/\son[a-z]+="/i);
      // Les rares scripts en ligne (hydratation des îlots) sont autorisés par leur empreinte dans la CSP (voir postbuild.mjs).
      const inline = [
        ...html.matchAll(
          /<script(?![^>]*src=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/gi,
        ),
      ].map((m) => m[1]!);
      for (const code of inline)
        expect(code, 'script en ligne inattendu').toMatch(/astro-island|self\.Astro/);
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

  describe('sitemap (référence : /sitemap.xml, voir docs/seo.md)', () => {
    const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf-8');
    const locs = attr(xml, /<loc>([^<]+)<\/loc>/g);
    const canonical = (html: string) => attr(html, /<link rel="canonical" href="([^"]+)"/)[0];
    const noindex = (html: string) => /<meta name="robots" content="[^"]*noindex/.test(html);

    it('est une liste d’URL (urlset) UTF-8 au bon espace de noms, pas un index', () => {
      expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).not.toContain('<sitemapindex');
      expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
      expect(xml.match(/<url>/g)).toHaveLength(locs.length);
    });

    it('sitemap-0.xml (déjà soumis à la Search Console) est identique ; sitemap-index.xml n’est plus publié', () => {
      expect(readFileSync(join(DIST, 'sitemap-0.xml'), 'utf-8')).toBe(xml);
      expect(existsSync(join(DIST, 'sitemap-index.xml'))).toBe(false);
    });

    it('robots.txt déclare /sitemap.xml et rien d’autre', () => {
      const robots = readFileSync(join(DIST, 'robots.txt'), 'utf-8');
      const declared = [...robots.matchAll(/^Sitemap:\s*(\S+)/gm)].map((m) => m[1]);
      expect(declared).toEqual([`${SITE}/sitemap.xml`]);
    });

    it('liste des URL absolues, uniques, avec des dates lastmod valides', () => {
      expect(locs.length).toBeGreaterThan(30);
      expect(new Set(locs).size).toBe(locs.length);
      for (const loc of locs) expect(loc).toMatch(/^https:\/\/grichard\.eu\/(?:[^\s?#]*\/)?$/);
      for (const date of attr(xml, /<lastmod>([^<]+)<\/lastmod>/g))
        expect(Number.isNaN(Date.parse(date)), date).toBe(false);
    });

    it('chaque URL est une page existante, indexable, dont la canonique est elle-même', () => {
      for (const loc of locs) {
        const target = resolveTarget(loc, '/')!;
        expect(existsSync(target), loc).toBe(true);
        const html = readFileSync(target, 'utf-8');
        expect(noindex(html), loc).toBe(false);
        expect(canonical(html), loc).toBe(loc);
      }
    });

    it('chaque page indexable et auto-canonique figure dans le sitemap (aucune page oubliée)', () => {
      const missing = pages
        .filter((p) => p.url !== '/404.html' && !noindex(p.html))
        .filter((p) => canonical(p.html) === SITE + p.url)
        .map((p) => SITE + p.url)
        .filter((url) => !locs.includes(url));
      expect(missing).toEqual([]);
    });
  });

  it('ai-catalog.json est un JSON valide et les PDF du CV existent', () => {
    const catalog = JSON.parse(readFileSync(join(DIST, '.well-known', 'ai-catalog.json'), 'utf-8'));
    for (const entry of catalog.entries)
      expect(existsSync(resolveTarget(entry.url, '/')!), entry.url).toBe(true);
  });
});
