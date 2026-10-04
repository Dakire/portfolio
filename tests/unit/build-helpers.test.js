import { describe, expect, it } from 'vitest';
import { assetTags } from '../../scripts/lib/assets.js';
import { json, page } from '../../scripts/lib/page.js';
import { buildLlmsTxt, buildSitemap } from '../../scripts/lib/sitemap.js';

describe('assetTags (manifeste Vite)', () => {
  const manifest = {
    'index.html': { file: 'assets/index-abc.js', isEntry: true, css: ['assets/index-abc.css'], imports: ['_vendor.js'] },
    '_vendor.js': { file: 'assets/vendor-def.js' },
  };

  it('produit la feuille de style, le préchargement et le script', () => {
    const tags = assetTags(manifest);
    expect(tags.css).toBe('<link rel="stylesheet" crossorigin href="/assets/index-abc.css">');
    expect(tags.full).toContain('<link rel="modulepreload" crossorigin href="/assets/vendor-def.js">');
    expect(tags.full).toContain('<script type="module" crossorigin src="/assets/index-abc.js"></script>');
  });

  it('échoue clairement sans entrée ou sans CSS', () => {
    expect(() => assetTags({})).toThrow(/Entrée introuvable/);
    expect(() => assetTags({ 'index.html': { file: 'a.js', isEntry: true } })).toThrow(/feuille de style/);
  });
});

describe('json (JSON embarqué dans <script>)', () => {
  it('empêche une donnée de refermer la balise', () => {
    expect(json({ x: '</script><script>alert(1)' })).not.toContain('</script>');
  });
});

describe('page', () => {
  const base = { assets: '', title: 'A & B', description: 'd"q', path: '/x/', body: '<p>ok</p>' };

  it('échappe titre et description, et ajoute canonical + consent.js', () => {
    const html = page(base);
    expect(html).toContain('<title>A &amp; B</title>');
    expect(html).toContain('content="d&quot;q"');
    expect(html).toContain('<link rel="canonical" href="https://grichard.eu/x/" />');
    expect(html).toContain('/js/consent.js');
  });

  it('marque une page noindex et déclare les hreflang', () => {
    const html = page({ ...base, noindex: true, alternates: [{ lang: 'fr', path: '/x/' }, { lang: 'en', path: '/en/x/' }] });
    expect(html).toContain('noindex, follow');
    expect(html).toContain('hreflang="en" href="https://grichard.eu/en/x/"');
    expect(html).toContain('og:locale:alternate" content="en_US"');
  });
});

describe('sitemap et llms.txt', () => {
  it('produit un sitemap strictement conforme (aucun xhtml:link)', () => {
    const xml = buildSitemap([{ path: '/', lastmod: '2026-01-01' }, { path: '/blog/', lastmod: '2026-02-02' }]);
    expect(xml).toContain('<loc>https://grichard.eu/</loc>');
    expect(xml).toContain('<lastmod>2026-02-02</lastmod>');
    expect(xml).not.toContain('xhtml');
  });

  it('liste les articles des deux langues dans llms.txt', () => {
    const posts = { fr: [{ title: 'FR', description: 'd1', slug: 'a', lang: 'fr' }], en: [{ title: 'EN', description: 'd2', slug: 'b', lang: 'en' }] };
    const txt = buildLlmsTxt('# Base\n', posts, (p) => `/${p.lang}/${p.slug}/`);
    expect(txt).toContain('- [FR](https://grichard.eu/fr/a/) : d1');
    expect(txt).toContain('- [EN](https://grichard.eu/en/b/) : d2');
  });
});
