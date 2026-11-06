// Audit SEO du build : pour chaque page du sitemap, title, description, h1, canonical, hreflang, types JSON-LD
// et nombre de pages qui la citent depuis leur contenu (<main>, hors menu et pied de page).
//   node scripts/seo-audit.mjs            -> tableau Markdown sur la sortie standard
//   node scripts/seo-audit.mjs --json     -> données brutes
// À lancer après `pnpm --filter @grichard/web build`. Aucune dépendance : le HTML produit par Astro est régulier.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const SITE = 'https://grichard.eu';

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;|&#160;/g, ' ');
const strip = (s) =>
  decode(s.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

const sitemap = readFileSync(join(DIST, 'root-access.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ''));

const fileFor = (path) => join(DIST, path, 'index.html');

const pages = urls.map((path) => {
  const html = readFileSync(fileFor(path), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  const main = html.match(/<main[\s\S]*<\/main>/)?.[0] ?? '';
  const title = strip(head.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const description = decode(
    attr(head.match(/<meta name="description"[^>]*>/)?.[0] ?? '', 'content') ?? '',
  );
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => strip(m[1]));
  const canonical = attr(head.match(/<link rel="canonical"[^>]*>/)?.[0] ?? '', 'href') ?? '';
  const hreflang = [...head.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]);
  const types = new Set();
  for (const m of head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node && typeof node === 'object') {
        if (node['@type'] && (node['@context'] || node['@id'] || node.headline || node.name))
          [node['@type']].flat().forEach((t) => types.add(t));
        Object.values(node).forEach(walk);
      }
    };
    try {
      walk(JSON.parse(m[1]));
    } catch {
      types.add('JSON invalide');
    }
  }
  const ogImage = attr(head.match(/<meta property="og:image"[^>]*>/)?.[0] ?? '', 'content') ?? '';
  const modified = head.match(/"dateModified":"([^"]+)"/)?.[1]?.slice(0, 10) ?? '';
  const links = new Set(
    [...main.matchAll(/<a [^>]*href="([^"#?]+)/g)]
      .map((m) => m[1].replace(SITE, ''))
      .filter((h) => h.startsWith('/') && h !== path),
  );
  return {
    path,
    title,
    description,
    h1s,
    canonical,
    hreflang,
    types: [...types].sort(),
    ogImage,
    modified,
    links,
  };
});

for (const p of pages) p.inbound = pages.filter((q) => q !== p && q.links.has(p.path)).length;

const kind = (path) => {
  const p = path.replace(/^\/en/, '');
  if (/^\/blog\/(categorie|category)\//.test(p)) return 'catégorie';
  if (/^\/blog\/.+/.test(p)) return 'article';
  if (/^\/cheatsheets\/.+/.test(p)) return 'cheatsheet';
  if (/^\/(outils|tools)\/.+/.test(p)) return 'outil';
  if (/^\/(projets|projects)\/.+/.test(p)) return 'projet';
  return 'page';
};

if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      pages.map(({ links: _links, ...p }) => ({ ...p, kind: kind(p.path) })),
      null,
      2,
    ),
  );
  process.exit(0);
}

const cell = (s) => String(s).replace(/\|/g, '\\|');
const titleCount = new Map();
for (const p of pages) titleCount.set(p.title, (titleCount.get(p.title) ?? 0) + 1);

const flags = (p) => {
  const f = [];
  if (p.title.length > 62) f.push(`title ${p.title.length} car.`);
  if (titleCount.get(p.title) > 1) f.push('title dupliqué');
  if (p.description.length < 110 || p.description.length > 160)
    f.push(`desc. ${p.description.length} car.`);
  if (p.h1s.length !== 1) f.push(`${p.h1s.length} h1`);
  if (p.canonical !== `${SITE}${p.path}`) f.push('canonical ≠ URL');
  if (p.inbound === 0) f.push('orpheline');
  if (!existsSync(join(DIST, p.ogImage.replace(SITE, '')))) f.push('image OG absente');
  return f.join(', ');
};

const order = ['article', 'cheatsheet', 'outil', 'projet', 'catégorie', 'page'];
for (const k of order) {
  const list = pages.filter((p) => kind(p.path) === k).sort((a, b) => a.path.localeCompare(b.path));
  console.log(`\n### ${k[0].toUpperCase()}${k.slice(1)}s (${list.length})\n`);
  console.log(
    '| URL | Title (car.) | Description (car.) | H1 | hreflang | JSON-LD | Liens entrants | Alertes |',
  );
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const p of list)
    console.log(
      `| \`${p.path}\` | ${cell(p.title)} (${p.title.length}) | ${p.description.length} | ${cell(p.h1s.join(' / '))} | ${p.hreflang.filter((h) => h !== 'x-default').join(', ') || '—'} | ${p.types.join(', ')} | ${p.inbound} | ${flags(p) || '—'} |`,
    );
}
console.log(`\n${pages.length} pages auditées (canonical : auto-référent sauf alerte contraire).`);
