import { describe, expect, it } from 'vitest';
import { ogHtml } from '../../scripts/lib/og.js';
import { looksLikePdf, pageCount } from '../../scripts/lib/pdf.js';
import { absolutize, buildRss } from '../../scripts/lib/rss.js';

const post = (over = {}) => ({
  slug: 'a',
  lang: 'fr',
  title: 'Titre & "guillemets"',
  description: 'Une <description>',
  date: '2026-10-03',
  html: '<p>Lien <a href="/blog/b/">interne</a> et <img src="/og/x.png"> et ]]> piège</p>',
  ...over,
});

describe('buildRss', () => {
  const xml = buildRss({
    lang: 'fr',
    title: 'Blog',
    description: 'Desc',
    blogPath: '/blog/',
    feedPath: '/rss.xml',
    author: 'Guillaume Richard',
    postPath: (p) => `/blog/${p.slug}/`,
    posts: [post(), post({ slug: 'b', date: '2026-09-01', updated: '2026-10-10' })],
  });

  it('déclare le flux, la langue et la date du dernier contenu (déterministe)', () => {
    expect(xml).toContain('<atom:link href="https://grichard.eu/rss.xml" rel="self"');
    expect(xml).toContain('<language>fr-FR</language>');
    expect(xml).toContain('<lastBuildDate>Fri, 09 Oct 2026 22:00:00 GMT</lastBuildDate>'); // 10 oct. minuit à Paris
  });

  it('échappe titres et descriptions, et met le contenu en CDATA', () => {
    expect(xml).toContain('<title>Titre &amp; &quot;guillemets&quot;</title>');
    expect(xml).toContain('<description>Une &lt;description&gt;</description>');
    expect(xml).toContain('<content:encoded><![CDATA[');
  });

  it('ne laisse jamais « ]]> » fermer la section CDATA', () => {
    const inner = xml.slice(xml.indexOf('<content:encoded>'), xml.indexOf('</content:encoded>'));
    expect(inner.replaceAll(']]]]><![CDATA[>', '').match(/\]\]>/g)).toHaveLength(1); // seule la fermeture finale
  });

  it('rend les liens et images absolus', () => {
    expect(absolutize('<a href="/x/">a</a><img src="/y.png"><a href="//cdn.ex/z">b</a>')).toBe(
      '<a href="https://grichard.eu/x/">a</a><img src="https://grichard.eu/y.png"><a href="//cdn.ex/z">b</a>',
    );
  });

  it('produit un item par article avec un guid permanent', () => {
    expect(xml.match(/<item>/g)).toHaveLength(2);
    expect(xml).toContain('<guid isPermaLink="true">https://grichard.eu/blog/a/</guid>');
  });
});

describe('image de partage', () => {
  it('échappe le titre et adapte sa taille à sa longueur', () => {
    expect(ogHtml({ title: '<b>x</b>', kicker: 'k', byline: 'b' })).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(ogHtml({ title: 'court', kicker: 'k', byline: 'b' })).toContain('font-size: 78px');
    expect(ogHtml({ title: 'x'.repeat(60), kicker: 'k', byline: 'b' })).toContain('font-size: 66px');
    expect(ogHtml({ title: 'x'.repeat(100), kicker: 'k', byline: 'b' })).toContain('font-size: 54px');
  });
});

describe('PDF', () => {
  it('reconnaît un PDF valide et refuse le reste', () => {
    const pdf = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(30_000)]);
    expect(looksLikePdf(pdf)).toBe(true);
    expect(looksLikePdf(Buffer.from('<html>erreur</html>'))).toBe(false);
    expect(looksLikePdf(Buffer.from('%PDF-1.7 trop court'))).toBe(false);
  });

  it('compte les pages sans confondre /Page et /Pages', () => {
    const pdf = Buffer.from('<< /Type /Pages /Count 2 >> << /Type /Page >> << /Type /Page /Parent 1 0 R >>');
    expect(pageCount(pdf)).toBe(2);
  });
});
