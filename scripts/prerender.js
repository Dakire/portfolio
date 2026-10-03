// Pré-rendu au build : tout le site est généré en HTML statique, lisible sans JavaScript.
//  - accueil FR (/) et EN (/en/), hydratés ensuite par React ;
//  - mentions légales (/mentions-legales/, /en/legal-notice/) ;
//  - blog (content/blog/*.md) ;
//  - 404.html (ErrorDocument Apache) ;
//  - sitemap.xml et llms.txt, générés (aucune liste d'URL à maintenir à la main).
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { marked } from 'marked';
import { createServer } from 'vite';

const SITE = 'https://grichard.eu';
const OG_IMAGE = { url: `${SITE}/og-image.png`, width: 1200, height: 630, alt: 'Guillaume Richard, Technicien Informatique & Systèmes Numériques' };
const LOCALES = { fr: 'fr_FR', en: 'en_US' };
const TODAY = new Date().toISOString().slice(0, 10);

const root = (p) => new URL(`../${p}`, import.meta.url);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Ajoute ?v=<empreinte> aux scripts de public/js : un script modifié n'est jamais servi depuis un ancien cache navigateur.
const versioned = (src) => {
  try {
    const hash = createHash('sha1').update(readFileSync(root(`public${src}`))).digest('hex').slice(0, 8);
    return `${src}?v=${hash}`;
  } catch {
    return src;
  }
};
const json = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

/** Date du dernier commit touchant ces chemins (aujourd'hui s'ils ont des modifications non commitées). */
function gitDate(...paths) {
  try {
    const git = (...args) => execFileSync('git', args, { cwd: root('.'), stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (git('status', '--porcelain', '--', ...paths)) return TODAY;
    return git('log', '-1', '--format=%cs', '--', ...paths) || TODAY;
  } catch {
    return TODAY;
  }
}

const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&[a-z#0-9]+;/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Ajoute des ancres aux h2 (sommaire, liens profonds) et rend les tableaux défilables au clavier.
function enhance(html, tableLabel) {
  const toc = [];
  const used = new Set();
  const withIds = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner) => {
    const text = inner.replace(/<[^>]+>/g, '');
    const base = slugify(text) || 'section';
    let id = base;
    for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
    used.add(id);
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  const withTables = withIds
    .replace(/<table>/g, `<div class="table-scroll" role="region" aria-label="${esc(tableLabel)}" tabindex="0"><table>`)
    .replace(/<\/table>/g, '</table></div>');
  return { html: withTables, toc };
}

function parsePost(slug, raw, lang, tableLabel) {
  const m = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Front matter manquant dans ${slug}.md`);
  const meta = Object.fromEntries(
    m[1].split('\n').map((l) => {
      const i = l.indexOf(':');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"(.*)"$/, '$1')];
    }),
  );
  for (const k of ['title', 'description', 'date']) if (!meta[k]) throw new Error(`"${k}" manquant dans ${slug}.md`);
  const words = m[2].split(/\s+/).length;
  const { html, toc } = enhance(marked.parse(m[2]), tableLabel);
  return { slug, lang, ...meta, html, toc, readingTime: Math.max(1, Math.round(words / 200)) };
}

/**
 * Gabarit HTML commun.
 * - assets : balises <link>/<script> issues du build Vite (CSS, bundle JS de l'accueil)
 * - scripts : scripts autonomes de public/js/ (consent.js est toujours ajouté)
 * - alternates : [{ lang, path }] pour les balises hreflang
 */
function page({ lang = 'fr', assets, scripts = [], title, description, path, type = 'website', body, extraMeta = '', ld, noindex = false, alternates = [] }) {
  const url = `${SITE}${path}`;
  const alt = alternates
    .map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${SITE}${a.path}" />`)
    .join('\n    ');
  const others = alternates.filter((a) => a.lang !== lang && a.lang !== 'x-default').map((a) => `<meta property="og:locale:alternate" content="${LOCALES[a.lang]}" />`);
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#020617" />
    <meta name="color-scheme" content="dark" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="canonical" href="${url}" />
    ${alt}
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="author" content="Guillaume Richard" />
    <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="Guillaume Richard" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="${LOCALES[lang]}" />
    ${others.join('\n    ')}
    <meta property="og:image" content="${OG_IMAGE.url}" />
    <meta property="og:image:width" content="${OG_IMAGE.width}" />
    <meta property="og:image:height" content="${OG_IMAGE.height}" />
    <meta property="og:image:alt" content="${esc(OG_IMAGE.alt)}" />
    ${extraMeta}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${OG_IMAGE.url}" />
    ${assets}
    ${ld ? `<script type="application/ld+json">${json(ld)}</script>` : ''}
  </head>
  <body>${body}
    ${[...scripts, '/js/consent.js'].map((s) => `<script defer src="${esc(versioned(s))}"></script>`).join('\n    ')}
  </body>
</html>
`;
}

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { render, renderLegal, renderBlogIndex, renderBlogPost, renderNotFound } = await vite.ssrLoadModule('/src/entry-server.jsx');
  const { PORTFOLIO_DATA, LANGS, PROFILE } = await vite.ssrLoadModule('/src/data/content.js');

  const write = async (path, html) => {
    await mkdir(root(`dist${path}`), { recursive: true });
    await writeFile(root(`dist${path}index.html`), html);
  };

  // 0. Ressources produites par Vite (CSS + bundle de l'accueil), à réutiliser dans toutes les pages
  const built = await readFile(root('dist/index.html'), 'utf-8');
  const css = built.match(/<link rel="stylesheet"[^>]*>/)?.[0];
  const moduleScript = built.match(/<script type="module"[^>]*><\/script>/)?.[0];
  if (!css || !moduleScript) throw new Error('CSS ou bundle JS introuvable dans dist/index.html (build Vite requis avant le pré-rendu)');
  const preloads = (built.match(/<link rel="modulepreload"[^>]*>/g) ?? []).join('\n    ');

  // 1. Blog : lecture des articles (content/blog = français, content/blog/en = anglais)
  const loadPosts = async (lang, dir) => {
    const files = (await readdir(root(dir))).filter((f) => f.endsWith('.md'));
    const list = await Promise.all(
      files.map(async (f) => parsePost(f.replace(/\.md$/, ''), await readFile(root(`${dir}/${f}`), 'utf-8'), lang, PORTFOLIO_DATA[lang].blog.tableLabel)),
    );
    return list.sort((x, y) => y.date.localeCompare(x.date) || x.title.localeCompare(y.title));
  };
  const postsByLang = { fr: await loadPosts('fr', 'content/blog'), en: await loadPosts('en', 'content/blog/en') };
  const posts = postsByLang.fr;
  const allPosts = [...postsByLang.fr, ...postsByLang.en];
  const lite = (list) => list.map(({ slug, title, description, date, readingTime }) => ({ slug, title, description, date, readingTime }));

  // Lien entre traductions : chaque article anglais déclare `translationOf: <slug français>`
  const frBySlug = new Map(postsByLang.fr.map((p) => [p.slug, p]));
  for (const en of postsByLang.en) {
    const fr = frBySlug.get(en.translationOf);
    if (!fr) throw new Error(`translationOf introuvable pour content/blog/en/${en.slug}.md : "${en.translationOf}"`);
    fr.translation = en;
    en.translation = fr;
  }
  const blogPath = (post) => `${LANGS[post.lang].blog}${post.slug}/`;
  const translationAlternates = (post) =>
    post.translation
      ? [
          { lang: post.lang, path: blogPath(post) },
          { lang: post.translation.lang, path: blogPath(post.translation) },
          { lang: 'x-default', path: blogPath(post.lang === 'fr' ? post : post.translation) },
        ]
      : [];
  const blogAlternates = [
    { lang: 'fr', path: LANGS.fr.blog },
    { lang: 'en', path: LANGS.en.blog },
    { lang: 'x-default', path: LANGS.fr.blog },
  ];

  const person = { '@type': 'Person', '@id': `${SITE}/#person`, name: PROFILE.name, url: `${SITE}/` };
  const siteDate = gitDate('src', 'public/js');
  const homeLastmod = [siteDate, ...allPosts.map((p) => p.updated ?? p.date)].sort().at(-1);

  // 2. Accueil (FR / EN) et mentions légales
  const homeAlternates = [
    { lang: 'fr', path: LANGS.fr.home },
    { lang: 'en', path: LANGS.en.home },
    { lang: 'x-default', path: LANGS.fr.home },
  ];
  const legalAlternates = [
    { lang: 'fr', path: LANGS.fr.legal },
    { lang: 'en', path: LANGS.en.legal },
    { lang: 'x-default', path: LANGS.fr.legal },
  ];
  const personDescription = {
    fr: 'Technicien Informatique et Systèmes Numériques basé à Laval. Expert en infrastructure IT, migrations Cloud (Google Workspace, M365) et automatisation.',
    en: 'IT and Digital Systems Technician based in Laval, France. Expert in IT infrastructure, Cloud migrations (Google Workspace, M365) and automation.',
  };
  const knowsAbout = ['Administration Système', 'Réseaux informatiques', 'Google Workspace', 'Microsoft 365', 'Active Directory', 'Windows Server', 'DNS, SPF, DKIM, DMARC', 'Développement C#', 'Python', 'Java', 'PowerShell', 'Stormshield'];

  for (const lang of ['fr', 'en']) {
    const t = PORTFOLIO_DATA[lang];
    const path = LANGS[lang].home;
    await write(
      path,
      page({
        lang,
        assets: [css, preloads, moduleScript].filter(Boolean).join('\n    '),
        title: t.meta.title,
        description: t.meta.description,
        path,
        type: 'profile',
        alternates: homeAlternates,
        extraMeta: '<meta property="profile:first_name" content="Guillaume" />\n    <meta property="profile:last_name" content="Richard" />',
        body: `<div id="root">${render(lang, lite(postsByLang[lang]))}</div>\n    <script type="application/json" id="posts-data">${json(lite(postsByLang[lang]))}</script>`,
        ld: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'ProfilePage',
              '@id': `${SITE}${path}#profilepage`,
              url: `${SITE}${path}`,
              name: t.meta.title,
              inLanguage: lang === 'fr' ? 'fr-FR' : 'en',
              dateModified: homeLastmod,
              mainEntity: { '@id': `${SITE}/#person` },
            },
            {
              ...person,
              givenName: 'Guillaume',
              familyName: 'Richard',
              jobTitle: t.hero.role,
              description: personDescription[lang],
              homeLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Laval', postalCode: '53000', addressRegion: 'Pays de la Loire', addressCountry: 'FR' } },
              knowsLanguage: ['fr', 'en'],
              sameAs: [PROFILE.linkedin, PROFILE.github],
              worksFor: { '@type': 'Organization', name: 'TIXIA Services numériques', address: { '@type': 'PostalAddress', addressLocality: 'Laval', addressCountry: 'FR' } },
              alumniOf: { '@type': 'CollegeOrUniversity', name: 'Le Mans Université', address: { '@type': 'PostalAddress', addressLocality: 'Le Mans', addressCountry: 'FR' } },
              knowsAbout,
            },
          ],
        },
      }),
    );

    await write(
      LANGS[lang].legal,
      page({
        lang,
        assets: css,
        title: `${t.legal.title} | Guillaume Richard`,
        description: lang === 'fr' ? 'Mentions légales, hébergement, données personnelles et cookies du site grichard.eu.' : 'Legal notice, hosting, personal data and cookies of the grichard.eu website.',
        path: LANGS[lang].legal,
        alternates: legalAlternates,
        body: renderLegal(lang),
      }),
    );
  }

  // 3. Blog (FR et EN)
  for (const lang of ['fr', 'en']) {
    const list = postsByLang[lang];
    const b = PORTFOLIO_DATA[lang].blog;
    const blogRoot = LANGS[lang].blog;
    const inLanguage = lang === 'fr' ? 'fr-FR' : 'en';

    await write(
      blogRoot,
      page({
        lang,
        assets: css,
        title: 'Blog | Guillaume Richard',
        description: b.pageDescription,
        path: blogRoot,
        alternates: blogAlternates,
        body: renderBlogIndex(list, lang),
        ld: {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          '@id': `${SITE}${blogRoot}#blog`,
          url: `${SITE}${blogRoot}`,
          name: b.siteName,
          inLanguage,
          author: person,
          blogPost: list.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}${blogPath(p)}`, datePublished: p.date })),
        },
      }),
    );

    for (const post of list) {
      const related = list.filter((p) => p.slug !== post.slug).slice(0, 3);
      const path = blogPath(post);
      const modified = post.updated ?? post.date;
      await write(
        path,
        page({
          lang,
          assets: css,
          title: `${post.title} | Guillaume Richard`,
          description: post.description,
          path,
          type: 'article',
          alternates: translationAlternates(post),
          extraMeta: `<meta property="article:published_time" content="${post.date}" />\n    <meta property="article:modified_time" content="${modified}" />\n    <meta property="article:author" content="${SITE}${LANGS[lang].home}" />`,
          body: renderBlogPost(post, related, lang),
          scripts: post.script ? [post.script] : [],
          ld: {
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'BlogPosting',
                headline: post.title,
                description: post.description,
                url: `${SITE}${path}`,
                mainEntityOfPage: `${SITE}${path}`,
                image: OG_IMAGE.url,
                datePublished: post.date,
                dateModified: modified,
                inLanguage,
                author: person,
                publisher: person,
                isPartOf: { '@id': `${SITE}${blogRoot}#blog` },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: b.home, item: `${SITE}${LANGS[lang].home}` },
                  { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}${blogRoot}` },
                  { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE}${path}` },
                ],
              },
            ],
          },
        }),
      );
    }
  }

  // 4. Page 404 (servie par Apache via ErrorDocument) : évite les « soft 404 »
  await writeFile(
    root('dist/404.html'),
    page({
      assets: css,
      scripts: ['/js/404.js'],
      title: '404 : page introuvable | Guillaume Richard',
      description: "Cette page n'existe pas.",
      path: '/404.html',
      body: renderNotFound(),
      noindex: true,
    }),
  );

  // 5. Sitemap (avec hreflang) et llms.txt
  const url = (path, lastmod, alternates = []) =>
    `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${lastmod}</lastmod>${alternates
      .map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${SITE}${a.path}"/>`)
      .join('')}\n  </url>`;
  const newest = (list) => (list[0] ? (list[0].updated ?? list[0].date) : homeLastmod);
  await writeFile(
    root('dist/sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[
      url(LANGS.fr.home, homeLastmod, homeAlternates),
      url(LANGS.en.home, homeLastmod, homeAlternates),
      url(LANGS.fr.blog, newest(postsByLang.fr), blogAlternates),
      url(LANGS.en.blog, newest(postsByLang.en), blogAlternates),
      ...allPosts.map((p) => url(blogPath(p), p.updated ?? p.date, translationAlternates(p))),
      url(LANGS.fr.legal, siteDate, legalAlternates),
      url(LANGS.en.legal, siteDate, legalAlternates),
    ].join('\n')}\n</urlset>\n`,
  );

  const llms = await readFile(root('public/llms.txt'), 'utf-8');
  const llmsList = (list) => list.map((p) => `- [${p.title}](${SITE}${blogPath(p)}) : ${p.description}`).join('\n');
  await writeFile(
    root('dist/llms.txt'),
    `${llms.trimEnd()}\n\n## Articles de blog (français)\n${llmsList(postsByLang.fr)}\n\n## Blog articles (English)\n${llmsList(postsByLang.en)}\n`,
  );

  console.log(`Pré-rendu : accueil FR/EN, mentions légales, blog (${posts.length} articles FR + ${postsByLang.en.length} EN), 404, sitemap, llms.txt`);
} finally {
  await vite.close();
}
