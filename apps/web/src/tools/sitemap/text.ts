// Textes du « Vérificateur de sitemap » (FR/EN). La rédaction de chaque contrôle est dans checks.ts.
import { SEO_TOOL } from '../seo/text';

const fr = {
  ui: {
    meta: {
      title: 'Vérificateur de sitemap.xml gratuit : erreurs et robots.txt | Guillaume Richard',
      description:
        'Vérifiez un sitemap.xml : découverte via robots.txt, XML et protocole sitemaps.org, index, gzip, limite de 50 000 URL, doublons, lastmod, URL bloquées par robots.txt et échantillon de pages testées.',
      appDescription:
        'Outil gratuit de vérification de sitemap.xml : fichiers, URL déclarées, cohérence avec robots.txt et statut d’un échantillon de pages.',
    },
    h1: 'Vérificateur de sitemap',
    intro:
      'Saisissez l’adresse de votre site ou de son sitemap : fichiers, URL déclarées, cohérence avec robots.txt et 20 pages testées, avec la correction à apporter.',
    name: 'Vérificateur de sitemap',
    card: 'Contrôle d’un sitemap.xml : XML, index, gzip, 50 000 URL, doublons, lastmod, robots.txt et échantillon de pages testées.',
    keywords:
      'vérifier sitemap xml validateur sitemap erreur sitemap robots.txt lastmod sitemap index search console',
    form: {
      ...SEO_TOOL.fr.ui.form,
      url: 'Adresse du site ou du sitemap',
      urlHint:
        'exemple.fr (le sitemap est cherché dans robots.txt puis /sitemap.xml) ou l’adresse directe du sitemap.',
      urlPlaceholder: 'https://exemple.fr/sitemap.xml',
      submit: 'Vérifier le sitemap',
      running: 'Vérification en cours…',
    },
    results: {
      ...SEO_TOOL.fr.ui.results,
      title: 'Rapport',
      analysed: 'Adresse saisie',
      announce: (score: number, toFix: number) =>
        `Vérification terminée : score ${score} sur 100, ${toFix} point(s) à corriger.`,
    },
    severity: SEO_TOOL.fr.ui.severity,
    status: SEO_TOOL.fr.ui.status,
    errors: {
      ...SEO_TOOL.fr.ui.errors,
      empty: 'Saisissez l’adresse du site ou du sitemap.',
      rate_limited: 'Limite atteinte : 6 vérifications par heure. Réessayez plus tard.',
    } as Record<string, string>,
    tables: {
      discovery: {
        direct: 'adresse saisie',
        robots: 'déclaré dans robots.txt',
        default: '/sitemap.xml par défaut',
      },
      discoveryLabel: 'Sitemap trouvé par',
      files: 'Fichiers lus',
      file: 'Fichier',
      type: 'Type',
      urls: 'URL',
      size: 'Taille',
      httpStatus: 'Statut',
      sample: 'Échantillon de pages testées',
      page: 'Page',
      result: 'Résultat',
      ok: 'OK',
      redirect: 'redirigée',
      noindex: 'noindex',
      canonical: 'canonical différent',
      scroll: 'Tableau défilant horizontalement',
    },
    breadcrumb: { home: 'Accueil', tools: 'Outils' },
    privacy:
      'L’adresse saisie est envoyée à grichard.eu, qui lit le robots.txt, le ou les sitemaps et 20 pages du site, puis vous renvoie le rapport. Rien n’est conservé : ni l’adresse, ni les fichiers, ni le rapport. Seule une empreinte salée de votre adresse IP est gardée une heure pour limiter les abus.',
    seo: {
      whatTitle: 'Ce que vérifie l’outil',
      what: [
        [
          'Découverte et fichiers',
          'Sitemap déclaré dans robots.txt ou présent à /sitemap.xml ; statut HTTP, type de contenu, taille, compression gzip, XML bien formé, racine <urlset> ou <sitemapindex> et namespace sitemaps.org.',
        ],
        [
          'Index et limites',
          'Les index sont suivis jusqu’à deux niveaux (10 fichiers au plus) ; chaque fichier est contrôlé contre les limites du protocole : 50 000 URL et 50 Mio non compressés.',
        ],
        [
          'URL déclarées',
          'URL absolues, sur le même hôte, en HTTPS, sans doublon ni ancre ; dates <lastmod> au format W3C et pas dans le futur ; <priority> et <changefreq> signalés comme ignorés par Google.',
        ],
        [
          'Cohérence',
          'URL déclarées mais interdites par robots.txt, et 20 pages réparties sur la liste testées : statut, redirection, noindex, canonical qui désigne une autre page.',
        ],
      ],
      howTitle: 'Comment l’utiliser',
      how: 'Saisissez simplement le domaine : l’outil lit robots.txt pour trouver le sitemap déclaré, puis essaie /sitemap.xml. Vous pouvez aussi donner l’adresse exacte d’un sitemap ou d’un index. Les points sont classés par gravité ; corrigez d’abord les critiques (sitemap introuvable, XML invalide, URL bloquées ou en erreur), puis les importants. Le rapport s’exporte en JSON ou s’imprime.',
      faq: [
        [
          'Pourquoi <priority> et <changefreq> sont-ils signalés ?',
          'Google a confirmé ignorer ces deux balises. Elles ne sont pas une erreur, mais n’apportent rien : seule une date <lastmod> fiable est utilisée.',
        ],
        [
          'Toutes les URL de mon sitemap sont-elles testées ?',
          'Non : 20 pages réparties sur toute la liste (début, milieu, fin), pour rester rapide et ne pas surcharger votre serveur. Les contrôles de format (doublons, hôte, dates, robots.txt) portent, eux, sur toutes les URL lues.',
        ],
        [
          'Mon sitemap fait plus de 10 fichiers, est-ce un problème ?',
          'Non. L’outil s’arrête à 10 fichiers par vérification et l’indique ; vérifiez les autres en saisissant leur adresse directement.',
        ],
        [
          'Faut-il aussi déclarer le sitemap dans la Search Console ?',
          'C’est conseillé : la Search Console indique combien d’URL du sitemap sont réellement indexées et pourquoi les autres ne le sont pas.',
        ],
      ],
    },
    related: 'Voir aussi',
    relatedLinks: [],
  },
};

const en: typeof fr = {
  ui: {
    meta: {
      title: 'Free sitemap.xml checker: errors, robots.txt, URLs | Guillaume Richard',
      description:
        'Check a sitemap.xml: discovery through robots.txt, XML and sitemaps.org protocol, indexes, gzip, 50,000-URL limit, duplicates, lastmod, URLs blocked by robots.txt and a sample of tested pages.',
      appDescription:
        'Free sitemap.xml checker: files, declared URLs, consistency with robots.txt and the status of a sample of pages.',
    },
    h1: 'Sitemap checker',
    intro:
      'Enter your site or sitemap address: files, declared URLs, consistency with robots.txt and 20 tested pages, with the fix to apply.',
    name: 'Sitemap checker',
    card: 'Checks a sitemap.xml: XML, indexes, gzip, 50,000 URLs, duplicates, lastmod, robots.txt and a sample of tested pages.',
    keywords:
      'check sitemap xml sitemap validator sitemap errors robots.txt lastmod sitemap index search console',
    form: {
      ...SEO_TOOL.en.ui.form,
      url: 'Site or sitemap address',
      urlHint:
        'example.com (the sitemap is looked up in robots.txt, then /sitemap.xml) or the sitemap’s direct address.',
      urlPlaceholder: 'https://example.com/sitemap.xml',
      submit: 'Check the sitemap',
      running: 'Checking…',
    },
    results: {
      ...SEO_TOOL.en.ui.results,
      title: 'Report',
      analysed: 'Address entered',
      announce: (score: number, toFix: number) =>
        `Check complete: score ${score} out of 100, ${toFix} item(s) to fix.`,
    },
    severity: SEO_TOOL.en.ui.severity,
    status: SEO_TOOL.en.ui.status,
    errors: {
      ...SEO_TOOL.en.ui.errors,
      empty: 'Enter the site or sitemap address.',
      rate_limited: 'Limit reached: 6 checks per hour. Try again later.',
    },
    tables: {
      discovery: {
        direct: 'address entered',
        robots: 'declared in robots.txt',
        default: 'default /sitemap.xml',
      },
      discoveryLabel: 'Sitemap found via',
      files: 'Files read',
      file: 'File',
      type: 'Type',
      urls: 'URLs',
      size: 'Size',
      httpStatus: 'Status',
      sample: 'Sample of tested pages',
      page: 'Page',
      result: 'Result',
      ok: 'OK',
      redirect: 'redirected',
      noindex: 'noindex',
      canonical: 'different canonical',
      scroll: 'Horizontally scrolling table',
    },
    breadcrumb: { home: 'Home', tools: 'Tools' },
    privacy:
      'The address you enter is sent to grichard.eu, which reads the robots.txt, the sitemap(s) and 20 pages of the site, then returns the report. Nothing is kept: not the address, the files or the report. Only a salted hash of your IP address is kept for an hour to prevent abuse.',
    seo: {
      whatTitle: 'What the tool checks',
      what: [
        [
          'Discovery and files',
          'Sitemap declared in robots.txt or present at /sitemap.xml; HTTP status, content type, size, gzip compression, well-formed XML, <urlset> or <sitemapindex> root and sitemaps.org namespace.',
        ],
        [
          'Indexes and limits',
          'Indexes are followed up to two levels (10 files at most); each file is checked against the protocol limits: 50,000 URLs and 50 MiB uncompressed.',
        ],
        [
          'Declared URLs',
          'Absolute URLs on the same host, over HTTPS, without duplicates or anchors; <lastmod> dates in W3C format and not in the future; <priority> and <changefreq> flagged as ignored by Google.',
        ],
        [
          'Consistency',
          'URLs declared but disallowed by robots.txt, and 20 pages spread over the list tested: status, redirect, noindex, canonical pointing to another page.',
        ],
      ],
      howTitle: 'How to use it',
      how: 'Just enter the domain: the tool reads robots.txt to find the declared sitemap, then tries /sitemap.xml. You can also give the exact address of a sitemap or an index. Items are ranked by severity; fix critical ones first (sitemap not found, invalid XML, blocked or failing URLs), then important ones. The report can be exported as JSON or printed.',
      faq: [
        [
          'Why are <priority> and <changefreq> flagged?',
          'Google has confirmed it ignores both tags. They are not an error, but add nothing: only a reliable <lastmod> date is used.',
        ],
        [
          'Are all the URLs in my sitemap tested?',
          'No: 20 pages spread over the whole list (start, middle, end), to stay fast and spare your server. Format checks (duplicates, host, dates, robots.txt) cover every URL read.',
        ],
        [
          'My sitemap has more than 10 files: is that a problem?',
          'No. The tool stops at 10 files per check and says so; check the others by entering their address directly.',
        ],
        [
          'Should I also submit the sitemap in Search Console?',
          'It is recommended: Search Console shows how many sitemap URLs are actually indexed and why the others are not.',
        ],
      ],
    },
    related: 'See also',
    relatedLinks: [],
  },
};

export const SITEMAP_TOOL = { fr, en };
