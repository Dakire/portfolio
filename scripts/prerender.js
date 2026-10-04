// Pré-rendu au build : tout le site est généré en HTML statique, lisible sans JavaScript.
//  - accueil FR (/) et EN (/en/), dont seuls le menu et le formulaire sont hydratés ensuite par React ;
//  - mentions légales (/mentions-legales/, /en/legal-notice/) ;
//  - blog (content/blog/*.md) ;
//  - 404.html (ErrorDocument Apache) ;
//  - sitemap.xml, llms.txt et flux RSS (FR et EN), générés (aucune liste d'URL à maintenir à la main) ;
//  - images de partage des articles (og/) et PDF des CV, produits par Chromium (BUILD_FAST=1 les saute pour un build rapide).
// La logique réutilisable (front matter, dates, gabarit, sitemap…) est dans scripts/lib/, couverte par tests/unit.
import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { createServer } from 'vite';
import { assetTags, readManifest } from './lib/assets.js';
import { toIso } from './lib/dates.js';
import { gitDate } from './lib/git.js';
import { generateOgImages, OG_SIZE } from './lib/og.js';
import { generateCvPdfs } from './lib/pdf.js';
import { buildRss } from './lib/rss.js';
import { buildSearchIndex } from './lib/search-index.js';
import { parsePost } from './lib/markdown.js';
import { page, json, SITE } from './lib/page.js';
import { root } from './lib/paths.js';
import { blogLd, homeLd, person, postLd, toolLd } from './lib/schema.js';
import { buildLlmsTxt, buildSitemap } from './lib/sitemap.js';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { render, renderLegal, renderBlogIndex, renderBlogPost, renderNotFound, renderDnsTool } = await vite.ssrLoadModule('/src/entry-server.jsx');
  const { DNS_TOOL } = await vite.ssrLoadModule('/src/data/dns-tool.js');
  const { PALETTE } = await vite.ssrLoadModule('/src/data/palette.js');
  const { PORTFOLIO_DATA, LANGS, PROFILE, SECTION_IDS } = await vite.ssrLoadModule('/src/data/content.js');
  const { islandsData, ISLANDS_DATA_ID } = await vite.ssrLoadModule('/src/lib/islands.js');

  const write = async (path, html) => {
    await mkdir(root(`dist${path}`), { recursive: true });
    await writeFile(root(`dist${path}index.html`), html);
  };

  // 0. Ressources produites par Vite (CSS + bundle de l'accueil), à réutiliser dans toutes les pages
  const manifest = await readManifest();
  const assets = assetTags(manifest);
  // Pages avec îlots : le script d'entrée et le code des îlots dont elles ont besoin (préchargés)
  const homeAssets = assetTags(manifest, { islands: ['src/islands/contact.jsx', 'src/islands/terminal.jsx'] });
  const dnsAssets = assetTags(manifest, { islands: ['src/islands/dns.jsx'] });

  // 1. Blog : lecture des articles (content/blog = français, content/blog/en = anglais)
  const loadPosts = async (lang, dir) => {
    const files = (await readdir(root(dir))).filter((f) => f.endsWith('.md'));
    const list = await Promise.all(
      files.map(async (f) => parsePost(f.replace(/\.md$/, ''), await readFile(root(`${dir}/${f}`), 'utf-8'), lang, PORTFOLIO_DATA[lang].blog.tableLabel)),
    );
    return list.sort((x, y) => y.date.localeCompare(x.date) || x.title.localeCompare(y.title));
  };
  const postsByLang = { fr: await loadPosts('fr', 'content/blog'), en: await loadPosts('en', 'content/blog/en') };
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
  const alternatesOf = (key) => [
    { lang: 'fr', path: LANGS.fr[key] },
    { lang: 'en', path: LANGS.en[key] },
    { lang: 'x-default', path: LANGS.fr[key] },
  ];

  // Images de partage : une par article (titre en grand). Sans Chromium, les pages gardent l'image générique.
  const fast = process.env.BUILD_FAST === '1';
  const ogDone = fast
    ? new Set()
    : await generateOgImages(
        allPosts.map((p) => ({ key: p.slug, title: p.title, kicker: `Blog · ${p.readingTime} ${PORTFOLIO_DATA[p.lang].blog.min}`, byline: `${PROFILE.name} · grichard.eu` })),
        'dist/og',
      );
  const ogImage = (post) => (ogDone.has(post.slug) ? { url: `${SITE}/og/${post.slug}.png`, ...OG_SIZE, alt: post.title } : undefined);
  const feedsFor = (lang) => [{ title: `${PORTFOLIO_DATA[lang].blog.siteName} (RSS)`, path: LANGS[lang].rss }];

  const author = person(PROFILE);
  const siteDate = gitDate('src', 'public/js');
  const homeLastmodIso = [siteDate, ...allPosts.map((p) => toIso(p.updated ?? p.date))].sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1);
  const homeLastmod = homeLastmodIso.slice(0, 10); // le sitemap n'a besoin que de la date

  // 2. Accueil (FR / EN) et mentions légales
  for (const lang of ['fr', 'en']) {
    const t = PORTFOLIO_DATA[lang];
    const path = LANGS[lang].home;
    await write(
      path,
      page({
        lang,
        assets: homeAssets.full,
        title: t.meta.title,
        description: t.meta.description,
        path,
        type: 'profile',
        alternates: alternatesOf('home'),
        feeds: feedsFor(lang),
        extraMeta: '<meta property="profile:first_name" content="Guillaume" />\n    <meta property="profile:last_name" content="Richard" />',
        body: `<div id="root">${render(lang, lite(postsByLang[lang]))}</div>\n    <script type="application/json" id="${ISLANDS_DATA_ID}">${json(islandsData(lang, t, lite(postsByLang[lang])))}</script>`,
        ld: homeLd({ lang, path, t, profile: PROFILE, dateModified: homeLastmodIso }),
      }),
    );

    await write(
      LANGS[lang].legal,
      page({
        lang,
        assets: assets.css,
        title: `${t.legal.title} | Guillaume Richard`,
        description: lang === 'fr' ? 'Mentions légales, hébergement, données personnelles et cookies du site grichard.eu.' : 'Legal notice, hosting, personal data and cookies of the grichard.eu website.',
        path: LANGS[lang].legal,
        alternates: alternatesOf('legal'),
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
        assets: assets.css,
        title: 'Blog | Guillaume Richard',
        description: b.pageDescription,
        path: blogRoot,
        alternates: alternatesOf('blog'),
        feeds: feedsFor(lang),
        body: renderBlogIndex(list, lang),
        ld: blogLd({ blogRoot, name: b.siteName, inLanguage, author, posts: list, postUrl: blogPath }),
      }),
    );

    for (const post of list) {
      const related = list.filter((p) => p.slug !== post.slug).slice(0, 3);
      const path = blogPath(post);
      await write(
        path,
        page({
          lang,
          assets: assets.css,
          title: `${post.title} | Guillaume Richard`,
          description: post.description,
          path,
          type: 'article',
          alternates: translationAlternates(post),
          feeds: feedsFor(lang),
          image: ogImage(post),
          extraMeta: `<meta property="article:published_time" content="${toIso(post.date)}" />\n    <meta property="article:modified_time" content="${toIso(post.updated ?? post.date)}" />\n    <meta property="article:author" content="${SITE}${LANGS[lang].home}" />`,
          body: renderBlogPost(post, related, lang),
          scripts: post.script ? [post.script] : [],
          ld: postLd({ post, path, blogRoot, homePath: LANGS[lang].home, inLanguage, author, labels: b, image: ogImage(post)?.url }),
        }),
      );
    }
  }

  // 3b. Outil DNS (FR et EN) : page pré-rendue, outil hydraté
  for (const lang of ['fr', 'en']) {
    const ui = DNS_TOOL[lang].ui;
    const path = LANGS[lang].dns;
    await write(
      path,
      page({
        lang,
        assets: dnsAssets.full,
        title: ui.meta.title,
        description: ui.meta.description,
        path,
        alternates: alternatesOf('dns'),
        feeds: feedsFor(lang),
        body: `${renderDnsTool(lang, lite(postsByLang[lang]))}
    <script type="application/json" id="${ISLANDS_DATA_ID}">${json({ lang })}</script>`,
        ld: toolLd({ lang, path, ui, homePath: LANGS[lang].home, author }),
      }),
    );
  }

  // 4. Page 404 (servie par Apache via ErrorDocument) : évite les « soft 404 »
  await writeFile(
    root('dist/404.html'),
    page({
      assets: assets.css,
      scripts: ['/js/404.js'],
      title: '404 : page introuvable | Guillaume Richard',
      description: "Cette page n'existe pas.",
      path: '/404.html',
      body: renderNotFound(),
      noindex: true,
    }),
  );

  // 5. Sitemap et llms.txt
  const newest = (list) => (list[0] ? (list[0].updated ?? list[0].date) : homeLastmod);
  await writeFile(
    root('dist/sitemap.xml'),
    buildSitemap([
      { path: LANGS.fr.home, lastmod: homeLastmod },
      { path: LANGS.en.home, lastmod: homeLastmod },
      { path: LANGS.fr.blog, lastmod: newest(postsByLang.fr) },
      { path: LANGS.en.blog, lastmod: newest(postsByLang.en) },
      ...allPosts.map((p) => ({ path: blogPath(p), lastmod: p.updated ?? p.date })),
      { path: LANGS.fr.dns, lastmod: siteDate.slice(0, 10) },
      { path: LANGS.en.dns, lastmod: siteDate.slice(0, 10) },
      { path: LANGS.fr.legal, lastmod: siteDate.slice(0, 10) },
      { path: LANGS.en.legal, lastmod: siteDate.slice(0, 10) },
    ]),
  );
  await writeFile(root('dist/llms.txt'), buildLlmsTxt(await readFile(root('public/llms.txt'), 'utf-8'), postsByLang, blogPath));

  // 5a. Index de la palette de commandes (chargé à la première ouverture)
  await writeFile(
    root('dist/search-index.json'),
    JSON.stringify(buildSearchIndex({ data: PORTFOLIO_DATA, langs: LANGS, profile: PROFILE, palette: PALETTE, sections: SECTION_IDS, posts: postsByLang, postPath: blogPath })),
  );

  // 5b. Flux RSS (un par langue)
  for (const lang of ['fr', 'en']) {
    const b = PORTFOLIO_DATA[lang].blog;
    await writeFile(
      root(`dist${LANGS[lang].rss}`),
      buildRss({ lang, title: b.siteName, description: b.pageDescription, blogPath: LANGS[lang].blog, feedPath: LANGS[lang].rss, author: PROFILE.name, postPath: blogPath, posts: postsByLang[lang] }),
    );
  }

  // 5c. PDF des CV, régénérés depuis leurs sources HTML (les PDF de public/ restent en secours si Chromium ou le réseau manquent)
  const pdfs = fast
    ? []
    : await generateCvPdfs([
        { source: 'public/cv-fr.html', out: 'dist/CV_Guillaume_Richard_FR.pdf' },
        { source: 'public/cv-en.html', out: 'dist/Resume_Guillaume_Richard_EN.pdf' },
      ]);

  // 6. Le manifeste Vite n'a plus d'utilité une fois les pages générées : il ne doit pas être déployé
  await rm(root('dist/.vite'), { recursive: true, force: true });

  console.log(`Pré-rendu : accueil FR/EN, mentions légales, blog (${postsByLang.fr.length} articles FR + ${postsByLang.en.length} EN), 404, sitemap, llms.txt, RSS, ${ogDone.size} images de partage, PDF des CV (${pdfs.map((r) => r.status).join(', ') || 'ignorés'})`);
} finally {
  await vite.close();
}
