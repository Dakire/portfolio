// Textes de l'outil « Rapport SEO » (FR/EN) : page, formulaire, états, erreurs. La rédaction de chaque contrôle est dans checks.ts.
import type { CheckSeverity, CheckStatus } from '../server/types';
import type { CheckCategory } from './checks';

const fr = {
  ui: {
    meta: {
      title: 'Rapport SEO gratuit : audit technique d’une page | Guillaume Richard',
      description:
        'Auditez une page en quelques secondes : title, meta description, canonical, Hn, images, liens cassés, Open Graph, JSON-LD, robots.txt, HTTPS, HSTS et en-têtes de sécurité. Score, priorités et export.',
      appDescription:
        'Audit SEO technique gratuit : plus de 30 contrôles classés par priorité (critique, important, info), avec recommandation pour chacun, export JSON et impression.',
    },
    h1: 'Rapport SEO',
    intro:
      'Saisissez l’adresse d’une page : plus de 30 contrôles SEO, sécurité et accessibilité, classés par priorité, avec la correction à apporter.',
    name: 'Rapport SEO',
    card: 'Audit technique d’une page : balises, titres, liens cassés, Open Graph, JSON-LD, robots.txt, HTTPS et en-têtes de sécurité.',
    keywords:
      'audit seo gratuit rapport seo analyse page balise title meta description canonical robots.txt en-têtes sécurité',
    form: {
      url: 'Adresse de la page',
      urlHint:
        'Une page publique (http ou https). Exemple : exemple.fr ou https://exemple.fr/contact/',
      urlPlaceholder: 'https://exemple.fr/',
      submit: 'Analyser la page',
      running: 'Analyse en cours…',
      captchaLabel: 'Vérification anti-robot',
      captchaLoading: 'Chargement de la vérification anti-robot…',
      retryCaptcha: 'Recharger la vérification',
    },
    results: {
      title: 'Rapport',
      score: 'Score',
      scoreOf: 'sur 100',
      analysed: 'Page analysée',
      finalUrl: 'Adresse finale',
      toFix: 'À corriger',
      passed: 'Conformes',
      none: 'Rien à corriger : bravo.',
      fix: 'Correction',
      exportJson: 'Exporter en JSON',
      print: 'Imprimer ou enregistrer en PDF',
      again: 'Nouvelle analyse',
      announce: (score: number, toFix: number) =>
        `Analyse terminée : score ${score} sur 100, ${toFix} point(s) à corriger.`,
      summary: (c: number, i: number, m: number) =>
        `${c} critique(s), ${i} important(s), ${m} mineur(s)`,
    },
    severity: { critical: 'Critique', important: 'Important', info: 'Info' } satisfies Record<
      CheckSeverity,
      string
    >,
    status: {
      pass: 'Conforme',
      warn: 'À améliorer',
      fail: 'À corriger',
      info: 'Information',
    } satisfies Record<CheckStatus, string>,
    categories: {
      http: 'Serveur et HTTP',
      meta: 'Balises et indexation',
      content: 'Contenu',
      links: 'Liens',
      social: 'Partage et données structurées',
      crawl: 'Exploration',
      security: 'En-têtes de sécurité',
      accessibility: 'Accessibilité de base',
    } satisfies Record<CheckCategory, string>,
    errors: {
      empty: 'Saisissez l’adresse d’une page.',
      invalid_url:
        'Adresse invalide : saisissez une URL http(s) publique, sans identifiants ni port particulier.',
      blocked_address:
        'Cette adresse n’est pas publique (réseau local, boucle locale…) : elle ne peut pas être analysée.',
      dns_failure: 'Ce nom de domaine ne se résout pas : vérifiez l’orthographe.',
      timeout: 'Le site a mis trop de temps à répondre.',
      tls_error: 'Connexion sécurisée impossible : certificat TLS invalide ou expiré.',
      too_many_redirects: 'Trop de redirections (plus de 5).',
      connection_failed: 'Le site n’a pas pu être joint.',
      captcha: 'La vérification anti-robot a échoué : réessayez.',
      captchaMissing: 'Validez d’abord la vérification anti-robot.',
      captchaUnavailable: 'La vérification anti-robot ne se charge pas (bloqueur de contenu ?).',
      csrf: 'Votre session a expiré : rechargez la page.',
      rate_limited: 'Limite atteinte : 12 analyses par heure. Réessayez plus tard.',
      unavailable: 'L’outil est momentanément indisponible.',
      generic: 'L’analyse a échoué. Réessayez dans un instant.',
    } as Record<string, string>,
    breadcrumb: { home: 'Accueil', tools: 'Outils' },
    privacy:
      'L’adresse saisie est envoyée à grichard.eu, qui interroge la page puis vous renvoie le rapport. Rien n’est conservé : ni l’adresse, ni la page, ni le rapport. Seule une empreinte salée de votre adresse IP est gardée une heure pour limiter les abus.',
    seo: {
      whatTitle: 'Ce que vérifie le rapport',
      what: [
        [
          'Serveur et indexation',
          'Statut HTTP, chaîne de redirections, HTTPS et HSTS, temps de réponse, compression ; balise meta robots et en-tête X-Robots-Tag, canonical, robots.txt (page bloquée, ligne Sitemap).',
        ],
        [
          'Balises et contenu',
          'Longueur du title et de la meta description, langue, viewport, h1 unique et ordre des titres, nombre de mots, attribut alt des images, échantillon de 10 liens testés.',
        ],
        [
          'Partage et données structurées',
          'Open Graph et carte Twitter/X (l’aperçu des partages), blocs JSON-LD schema.org (présence, validité, types), favicon.',
        ],
        [
          'Sécurité et accessibilité',
          'Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy ; champs sans étiquette, repères main/nav, lien d’évitement.',
        ],
      ],
      howTitle: 'Comment lire le rapport',
      how: 'Chaque contrôle a une gravité : critique (bloque l’indexation ou la sécurité), important (pénalise le classement ou l’expérience), info (bonne pratique). Le score sur 100 pondère les contrôles par gravité ; un point « à améliorer » compte pour moitié. Commencez par les points critiques, puis importants. Le rapport s’exporte en JSON ou s’imprime (enregistrement en PDF depuis la fenêtre d’impression).',
      faq: [
        [
          'Le rapport analyse-t-il tout mon site ?',
          'Non : une page par analyse, celle dont vous donnez l’adresse (après redirections). Pour vérifier l’ensemble des pages déclarées, utilisez le vérificateur de sitemap.',
        ],
        [
          'Pourquoi un lien LinkedIn apparaît-il « non vérifiable » ?',
          'Certains sites refusent les robots (LinkedIn répond par un code 999, d’autres par 403 ou 429). Le lien fonctionne sans doute pour un visiteur : il n’est pas compté comme cassé.',
        ],
        [
          'Pourquoi des en-têtes de sécurité dans un rapport SEO ?',
          'HTTPS et HSTS sont des signaux de classement, et un site compromis (XSS, clickjacking) est rapidement déclassé ou signalé comme dangereux. Ces en-têtes coûtent une ligne de configuration.',
        ],
        [
          'Puis-je analyser une adresse de mon réseau local ?',
          'Non. Par sécurité, l’outil refuse toute adresse non publique (réseaux privés, boucle locale, métadonnées des clouds), y compris après une redirection.',
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
      title: 'Free SEO report: technical audit of a page | Guillaume Richard',
      description:
        'Audit a page in seconds: title, meta description, canonical, headings, images, broken links, Open Graph, JSON-LD, robots.txt, HTTPS, HSTS and security headers. Score, priorities and export.',
      appDescription:
        'Free technical SEO audit: over 30 checks ranked by priority (critical, important, info), each with a recommendation, JSON export and print.',
    },
    h1: 'SEO report',
    intro:
      'Enter a page address: over 30 SEO, security and accessibility checks, ranked by priority, with the fix to apply.',
    name: 'SEO report',
    card: 'Technical audit of a page: tags, headings, broken links, Open Graph, JSON-LD, robots.txt, HTTPS and security headers.',
    keywords:
      'free seo audit seo report page analysis title tag meta description canonical robots.txt security headers',
    form: {
      url: 'Page address',
      urlHint:
        'A public page (http or https). Example: example.com or https://example.com/contact/',
      urlPlaceholder: 'https://example.com/',
      submit: 'Analyse the page',
      running: 'Analysing…',
      captchaLabel: 'Anti-bot check',
      captchaLoading: 'Loading the anti-bot check…',
      retryCaptcha: 'Reload the check',
    },
    results: {
      title: 'Report',
      score: 'Score',
      scoreOf: 'out of 100',
      analysed: 'Analysed page',
      finalUrl: 'Final address',
      toFix: 'To fix',
      passed: 'Passed',
      none: 'Nothing to fix: well done.',
      fix: 'Fix',
      exportJson: 'Export as JSON',
      print: 'Print or save as PDF',
      again: 'New analysis',
      announce: (score: number, toFix: number) =>
        `Analysis complete: score ${score} out of 100, ${toFix} item(s) to fix.`,
      summary: (c: number, i: number, m: number) => `${c} critical, ${i} important, ${m} minor`,
    },
    severity: { critical: 'Critical', important: 'Important', info: 'Info' },
    status: { pass: 'Passed', warn: 'To improve', fail: 'To fix', info: 'Information' },
    categories: {
      http: 'Server and HTTP',
      meta: 'Tags and indexing',
      content: 'Content',
      links: 'Links',
      social: 'Sharing and structured data',
      crawl: 'Crawling',
      security: 'Security headers',
      accessibility: 'Basic accessibility',
    },
    errors: {
      empty: 'Enter a page address.',
      invalid_url:
        'Invalid address: enter a public http(s) URL, without credentials or unusual port.',
      blocked_address:
        'This address is not public (local network, loopback…): it cannot be analysed.',
      dns_failure: 'This domain name does not resolve: check the spelling.',
      timeout: 'The site took too long to respond.',
      tls_error: 'Secure connection failed: invalid or expired TLS certificate.',
      too_many_redirects: 'Too many redirects (more than 5).',
      connection_failed: 'The site could not be reached.',
      captcha: 'The anti-bot check failed: try again.',
      captchaMissing: 'Complete the anti-bot check first.',
      captchaUnavailable: 'The anti-bot check does not load (content blocker?).',
      csrf: 'Your session has expired: reload the page.',
      rate_limited: 'Limit reached: 12 analyses per hour. Try again later.',
      unavailable: 'The tool is temporarily unavailable.',
      generic: 'The analysis failed. Try again in a moment.',
    },
    breadcrumb: { home: 'Home', tools: 'Tools' },
    privacy:
      'The address you enter is sent to grichard.eu, which fetches the page and returns the report. Nothing is kept: not the address, the page or the report. Only a salted hash of your IP address is kept for an hour to prevent abuse.',
    seo: {
      whatTitle: 'What the report checks',
      what: [
        [
          'Server and indexing',
          'HTTP status, redirect chain, HTTPS and HSTS, response time, compression; robots meta tag and X-Robots-Tag header, canonical, robots.txt (blocked page, Sitemap line).',
        ],
        [
          'Tags and content',
          'Title and meta description length, language, viewport, single h1 and heading order, word count, image alt attributes, a sample of 10 links tested.',
        ],
        [
          'Sharing and structured data',
          'Open Graph and Twitter/X card (share previews), schema.org JSON-LD blocks (presence, validity, types), favicon.',
        ],
        [
          'Security and accessibility',
          'Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy; unlabelled fields, main/nav landmarks, skip link.',
        ],
      ],
      howTitle: 'How to read the report',
      how: 'Each check has a severity: critical (blocks indexing or security), important (hurts ranking or experience), info (good practice). The score out of 100 weights checks by severity; an item “to improve” counts for half. Start with critical items, then important ones. The report can be exported as JSON or printed (save as PDF from the print dialog).',
      faq: [
        [
          'Does the report analyse my whole site?',
          'No: one page per analysis, the one whose address you give (after redirects). To check every declared page, use the sitemap checker.',
        ],
        [
          'Why is a LinkedIn link “unverifiable”?',
          'Some sites block robots (LinkedIn answers with a 999 code, others with 403 or 429). The link probably works for a visitor: it is not counted as broken.',
        ],
        [
          'Why security headers in an SEO report?',
          'HTTPS and HSTS are ranking signals, and a compromised site (XSS, clickjacking) is quickly demoted or flagged as dangerous. These headers cost one line of configuration.',
        ],
        [
          'Can I analyse an address on my local network?',
          'No. For security, the tool refuses any non-public address (private networks, loopback, cloud metadata), including after a redirect.',
        ],
      ],
    },
    related: 'See also',
    relatedLinks: [],
  },
};

export const SEO_TOOL = { fr, en };
