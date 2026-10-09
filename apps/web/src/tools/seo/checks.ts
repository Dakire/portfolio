// Rapport SEO : forme de la réponse de tools.php et rédaction de chaque contrôle (FR/EN).
// Le serveur ne renvoie que des identifiants et des valeurs ; le titre, l'explication et la recommandation sont écrits ici,
// à partir des valeurs mesurées. tests/unit/tools/seo.test.ts vérifie que chaque contrôle est rédigé dans les deux langues.
import type { Lang } from '../../lib/i18n';

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';
export type CheckSeverity = 'critical' | 'important' | 'info';
export type CheckCategory =
  'http' | 'meta' | 'content' | 'links' | 'social' | 'crawl' | 'security' | 'accessibility';

export interface SeoCheck {
  id: string;
  category: CheckCategory;
  severity: CheckSeverity;
  status: CheckStatus;
  data: Record<string, unknown>;
}

export interface SeoReport {
  url: string;
  finalUrl: string;
  status: number;
  score: number;
  summary: { critical: number; important: number; info: number; passed: number };
  checks: SeoCheck[];
}

export interface Described {
  title: string;
  detail: string;
  fix: string;
}

// Lecture prudente des valeurs (le JSON vient du réseau)
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const quote = (lang: Lang, s: string) => (lang === 'fr' ? `« ${s} »` : `“${s}”`);

type Writer = (d: Record<string, unknown>, status: CheckStatus, lang: Lang) => Described;
const t = (lang: Lang, fr: string, en: string) => (lang === 'fr' ? fr : en);
const D = (title: string, detail = '', fix = ''): Described => ({ title, detail, fix });

/** Rédaction de chaque contrôle. La correction n'est affichée que si le contrôle n'est pas conforme. */
export const WRITERS: Record<string, Writer> = {
  html: (d, _s, l) =>
    D(
      t(l, 'La réponse n’est pas une page HTML', 'The response is not an HTML page'),
      t(
        l,
        `Type reçu : ${str(d.contentType) || 'inconnu'}.`,
        `Received type: ${str(d.contentType) || 'unknown'}.`,
      ),
      t(
        l,
        'Analysez l’adresse d’une page web (text/html).',
        'Analyse the address of a web page (text/html).',
      ),
    ),
  http_status: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'La page répond 200 OK', 'The page returns 200 OK')
        : t(l, `La page répond ${num(d.status)}`, `The page returns ${num(d.status)}`),
      t(
        l,
        'Les moteurs n’indexent que les pages qui répondent 200.',
        'Search engines only index pages that return 200.',
      ),
      t(
        l,
        'Corrigez l’adresse ou la configuration du serveur pour que la page réponde 200.',
        'Fix the address or server configuration so the page returns 200.',
      ),
    ),
  https: (_d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Page servie en HTTPS', 'Page served over HTTPS')
        : t(l, 'Page servie sans HTTPS', 'Page served without HTTPS'),
      t(
        l,
        'HTTPS est un signal de classement et protège les visiteurs.',
        'HTTPS is a ranking signal and protects visitors.',
      ),
      t(
        l,
        'Installez un certificat (Let’s Encrypt, gratuit) et redirigez http:// vers https:// en 301.',
        'Install a certificate (Let’s Encrypt is free) and 301-redirect http:// to https://.',
      ),
    ),
  redirects: (d, _s, l) => {
    const chain = list(d.chain)
      .map((step) => `${num(rec(step).status)} ${str(rec(step).url)}`)
      .join(' → ');
    return D(
      num(d.count) === 0
        ? t(l, 'Aucune redirection', 'No redirect')
        : t(
            l,
            `${num(d.count)} redirection(s) avant la page`,
            `${num(d.count)} redirect(s) before the page`,
          ),
      chain,
      t(
        l,
        'Faites pointer liens et canonical directement vers l’adresse finale : une seule redirection au plus.',
        'Point links and the canonical straight at the final address: one redirect at most.',
      ),
    );
  },
  hsts: (d, s, l) =>
    D(
      s === 'fail'
        ? t(l, 'En-tête HSTS absent', 'HSTS header missing')
        : s === 'warn'
          ? t(l, 'HSTS trop court', 'HSTS too short')
          : t(l, 'HSTS en place', 'HSTS in place'),
      d.value
        ? str(d.value)
        : t(
            l,
            'Le navigateur peut encore tenter une connexion non chiffrée.',
            'Browsers may still try an unencrypted connection.',
          ),
      'Strict-Transport-Security: max-age=31536000; includeSubDomains',
    ),
  response_time: (d, _s, l) =>
    D(
      t(
        l,
        `Réponse en ${num(d.seconds).toFixed(2)} s`,
        `Response in ${num(d.seconds).toFixed(2)} s`,
      ),
      t(
        l,
        `Premier octet : ${num(d.firstByte).toFixed(2)} s · ${Math.round(num(d.bytes) / 1024)} Kio${d.truncated ? ' (tronqué à 2 Mo)' : ''}.`,
        `First byte: ${num(d.firstByte).toFixed(2)} s · ${Math.round(num(d.bytes) / 1024)} KiB${d.truncated ? ' (truncated at 2 MB)' : ''}.`,
      ),
      t(
        l,
        'Visez moins de 0,8 s : cache de pages, PHP à jour, hébergement plus proche, moins de requêtes côté serveur.',
        'Aim for under 0.8 s: page caching, up-to-date PHP, closer hosting, fewer server-side queries.',
      ),
    ),
  compression: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, `Compression ${str(d.encoding)}`, `${str(d.encoding)} compression`)
        : t(l, 'Page non compressée', 'Page not compressed'),
      t(
        l,
        'La compression divise souvent le poids du HTML par 4 à 5.',
        'Compression often cuts HTML weight by 4 to 5 times.',
      ),
      t(
        l,
        'Activez gzip ou Brotli (Apache : mod_deflate / AddOutputFilterByType DEFLATE text/html).',
        'Enable gzip or Brotli (Apache: mod_deflate / AddOutputFilterByType DEFLATE text/html).',
      ),
    ),
  title: (d, s, l) =>
    D(
      !d.value
        ? t(l, 'Balise title absente', 'Missing title tag')
        : s === 'pass'
          ? t(l, `Titre de ${num(d.length)} caractères`, `${num(d.length)}-character title`)
          : t(
              l,
              `Titre de ${num(d.length)} caractères (30 à 60 conseillés)`,
              `${num(d.length)}-character title (30 to 60 advised)`,
            ),
      d.value ? quote(l, str(d.value)) : '',
      t(
        l,
        'Un titre unique de 30 à 60 caractères, mot-clé principal au début : c’est le lien bleu dans Google.',
        'A unique 30 to 60-character title, main keyword first: it is the blue link in Google.',
      ),
    ),
  meta_description: (d, s, l) =>
    D(
      !d.value
        ? t(l, 'Meta description absente', 'Missing meta description')
        : s === 'pass'
          ? t(
              l,
              `Meta description de ${num(d.length)} caractères`,
              `${num(d.length)}-character meta description`,
            )
          : t(
              l,
              `Meta description de ${num(d.length)} caractères (70 à 160 conseillés)`,
              `${num(d.length)}-character meta description (70 to 160 advised)`,
            ),
      d.value ? quote(l, str(d.value)) : '',
      t(
        l,
        'Résumez la page en 70 à 160 caractères : c’est souvent l’extrait affiché sous le titre.',
        'Summarise the page in 70 to 160 characters: it is often the snippet shown under the title.',
      ),
    ),
  canonical: (d, s, l) =>
    D(
      !d.value
        ? t(l, 'Pas de lien canonical', 'No canonical link')
        : d.self
          ? t(l, 'Canonical vers la page elle-même', 'Self-referencing canonical')
          : num(d.count) > 1
            ? t(l, `${num(d.count)} liens canonical`, `${num(d.count)} canonical links`)
            : t(l, 'Canonical vers une autre adresse', 'Canonical points to another address'),
      d.resolved ? str(d.resolved) : '',
      s === 'fail'
        ? t(
            l,
            'Gardez un seul <link rel="canonical"> avec une URL absolue valide.',
            'Keep a single <link rel="canonical"> with a valid absolute URL.',
          )
        : t(
            l,
            'Ajoutez <link rel="canonical" href="(adresse de la page)"> ; s’il désigne une autre page, vérifiez que c’est voulu.',
            'Add <link rel="canonical" href="(page address)">; if it points elsewhere, make sure that is intended.',
          ),
    ),
  robots_meta: (d, s, l) =>
    D(
      s === 'fail'
        ? t(l, 'La page interdit son indexation (noindex)', 'The page forbids indexing (noindex)')
        : t(l, 'Page indexable', 'Indexable page'),
      [d.meta && `meta robots : ${str(d.meta)}`, d.header && `X-Robots-Tag : ${str(d.header)}`]
        .filter(Boolean)
        .join(' · '),
      t(
        l,
        'Retirez noindex de la balise meta robots et de l’en-tête X-Robots-Tag si la page doit apparaître dans Google.',
        'Remove noindex from the robots meta tag and X-Robots-Tag header if the page should appear in Google.',
      ),
    ),
  lang: (d, s, l) =>
    D(
      s === 'fail'
        ? t(l, 'Langue de la page non déclarée', 'Page language not declared')
        : t(l, `Langue déclarée : ${str(d.value)}`, `Declared language: ${str(d.value)}`),
      t(
        l,
        'Utile aux moteurs et indispensable aux lecteurs d’écran (prononciation).',
        'Useful to search engines and essential for screen readers (pronunciation).',
      ),
      t(
        l,
        'Ajoutez <html lang="fr"> (ou le code de la langue de la page).',
        'Add <html lang="en"> (or the page language code).',
      ),
    ),
  viewport: (d, s, l) =>
    D(
      s === 'fail'
        ? t(l, 'Pas de balise viewport', 'No viewport tag')
        : d.blocksZoom
          ? t(l, 'Le zoom est bloqué', 'Zoom is blocked')
          : s === 'warn'
            ? t(l, 'Viewport incomplet', 'Incomplete viewport')
            : t(l, 'Viewport adapté au mobile', 'Mobile-friendly viewport'),
      d.value ? str(d.value) : '',
      t(
        l,
        'Utilisez <meta name="viewport" content="width=device-width, initial-scale=1">, sans user-scalable=no ni maximum-scale (WCAG 1.4.4).',
        'Use <meta name="viewport" content="width=device-width, initial-scale=1">, without user-scalable=no or maximum-scale (WCAG 1.4.4).',
      ),
    ),
  h1: (d, _s, l) =>
    D(
      num(d.count) === 1
        ? t(l, 'Un seul titre h1', 'A single h1 heading')
        : num(d.count) === 0
          ? t(l, 'Aucun titre h1', 'No h1 heading')
          : t(l, `${num(d.count)} titres h1`, `${num(d.count)} h1 headings`),
      t(
        l,
        'Le h1 annonce le sujet de la page aux moteurs et aux lecteurs d’écran.',
        'The h1 states the page topic to search engines and screen readers.',
      ),
      t(
        l,
        'Gardez un h1 unique qui reprend le sujet principal.',
        'Keep one h1 stating the main topic.',
      ),
    ),
  headings_order: (d, s, l) => {
    const skips = list(d.skips).map((x) => `h${num(rec(x).from) || '–'} → h${num(rec(x).to)}`);
    return D(
      s === 'fail'
        ? t(l, 'Aucun titre (h1 à h6)', 'No headings (h1 to h6)')
        : s === 'warn'
          ? t(l, 'Niveaux de titres sautés', 'Skipped heading levels')
          : t(
              l,
              `Hiérarchie des titres correcte (${num(d.total)})`,
              `Correct heading hierarchy (${num(d.total)})`,
            ),
      skips.join(', '),
      t(
        l,
        'Descendez d’un niveau à la fois (h1, h2, h3…) : la structure doit se lire comme un sommaire.',
        'Go down one level at a time (h1, h2, h3…): the structure should read like a table of contents.',
      ),
    );
  },
  word_count: (d, _s, l) =>
    D(
      t(l, `${num(d.words)} mots de contenu`, `${num(d.words)} words of content`),
      t(l, 'Un contenu trop court se positionne rarement.', 'Thin content rarely ranks.'),
      t(
        l,
        'Visez 300 mots au moins sur les pages importantes, en répondant vraiment à la question du visiteur.',
        'Aim for at least 300 words on key pages, really answering the visitor’s question.',
      ),
    ),
  text_ratio: (d, _s, l) =>
    D(
      t(l, `Ratio texte/HTML : ${num(d.percent)} %`, `Text/HTML ratio: ${num(d.percent)}%`),
      t(
        l,
        'Indicatif : un ratio très bas signale souvent un code lourd.',
        'Indicative: a very low ratio often points to heavy markup.',
      ),
      t(
        l,
        'Allégez le HTML (scripts et styles en fichiers externes, moins de balisage inutile).',
        'Lighten the HTML (external scripts and styles, less needless markup).',
      ),
    ),
  images_alt: (d, _s, l) =>
    D(
      num(d.missing) === 0
        ? t(
            l,
            `Toutes les images ont un attribut alt (${num(d.total)})`,
            `All images have an alt attribute (${num(d.total)})`,
          )
        : t(
            l,
            `${num(d.missing)} image(s) sans attribut alt sur ${num(d.total)}`,
            `${num(d.missing)} of ${num(d.total)} image(s) without alt`,
          ),
      list(d.examples).map(str).join(' · '),
      t(
        l,
        'Décrivez chaque image utile dans alt ; mettez alt="" aux images décoratives.',
        'Describe every meaningful image in alt; use alt="" for decorative ones.',
      ),
    ),
  links: (d, _s, l) =>
    D(
      t(
        l,
        `${num(d.internal)} lien(s) interne(s), ${num(d.external)} externe(s)`,
        `${num(d.internal)} internal link(s), ${num(d.external)} external`,
      ),
      num(d.nofollow)
        ? t(l, `${num(d.nofollow)} en nofollow.`, `${num(d.nofollow)} nofollow.`)
        : '',
    ),
  broken_links: (d, s, l) => {
    const broken = list(d.broken).map(
      (b) => `${str(rec(b).status ?? rec(b).error) || str(rec(b).error)} ${str(rec(b).url)}`,
    );
    const unverified = list(d.unverified).length;
    return D(
      s === 'info'
        ? t(l, 'Aucun lien à vérifier', 'No links to check')
        : broken.length
          ? t(
              l,
              `${broken.length} lien(s) cassé(s) sur ${num(d.checked)} vérifiés`,
              `${broken.length} broken link(s) out of ${num(d.checked)} checked`,
            )
          : t(
              l,
              `Aucun lien cassé sur ${num(d.checked)} vérifiés`,
              `No broken link out of ${num(d.checked)} checked`,
            ),
      [
        broken.join(' · '),
        unverified
          ? t(
              l,
              `${unverified} lien(s) non vérifiable(s) : le site refuse les robots.`,
              `${unverified} link(s) could not be verified: the site blocks robots.`,
            )
          : '',
      ]
        .filter(Boolean)
        .join(' '),
      t(
        l,
        'Corrigez ou retirez les liens en erreur (échantillon de 10 liens).',
        'Fix or remove the failing links (sample of 10 links).',
      ),
    );
  },
  open_graph: (d, s, l) => {
    const tags = rec(d.tags);
    const missing = ['og:title', 'og:description', 'og:image', 'og:url'].filter((k) => !tags[k]);
    return D(
      s === 'pass'
        ? t(l, 'Balises Open Graph complètes', 'Complete Open Graph tags')
        : t(l, 'Balises Open Graph manquantes', 'Missing Open Graph tags'),
      missing.join(', '),
      t(
        l,
        'Ajoutez og:title, og:description, og:image (1200×630) et og:url : ce sont l’aperçu des partages.',
        'Add og:title, og:description, og:image (1200×630) and og:url: they drive share previews.',
      ),
    );
  },
  twitter_card: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, `Carte Twitter/X : ${str(d.card)}`, `Twitter/X card: ${str(d.card)}`)
        : t(l, 'Pas de carte Twitter/X', 'No Twitter/X card'),
      '',
      '<meta name="twitter:card" content="summary_large_image">',
    ),
  structured_data: (d, s, l) =>
    D(
      num(d.blocks) === 0
        ? t(l, 'Aucune donnée structurée JSON-LD', 'No JSON-LD structured data')
        : s === 'fail'
          ? t(
              l,
              `${num(d.invalid)} bloc(s) JSON-LD invalide(s)`,
              `${num(d.invalid)} invalid JSON-LD block(s)`,
            )
          : t(
              l,
              `Données structurées : ${list(d.types).map(str).join(', ') || 'JSON-LD'}`,
              `Structured data: ${list(d.types).map(str).join(', ') || 'JSON-LD'}`,
            ),
      '',
      s === 'fail'
        ? t(
            l,
            'Corrigez la syntaxe JSON (validez-la avec l’outil Formateur JSON ou le test des résultats enrichis de Google).',
            'Fix the JSON syntax (check it with the JSON formatter or Google’s Rich Results Test).',
          )
        : t(
            l,
            'Ajoutez un bloc JSON-LD schema.org adapté (Organization, Person, Article, Product…).',
            'Add a suitable schema.org JSON-LD block (Organization, Person, Article, Product…).',
          ),
    ),
  favicon: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Favicon présent', 'Favicon found')
        : t(l, 'Favicon introuvable', 'No favicon found'),
      d.declared ? str(d.declared) : '',
      t(
        l,
        'Déclarez <link rel="icon" href="/favicon.svg"> : Google l’affiche dans les résultats mobiles.',
        'Declare <link rel="icon" href="/favicon.svg">: Google shows it in mobile results.',
      ),
    ),
  robots_txt: (d, s, l) =>
    D(
      !d.found
        ? t(l, 'Pas de robots.txt', 'No robots.txt')
        : d.blocksEverything
          ? t(l, 'robots.txt bloque tout le site', 'robots.txt blocks the whole site')
          : !d.pageAllowed
            ? t(l, 'robots.txt bloque cette page', 'robots.txt blocks this page')
            : s === 'warn'
              ? t(l, 'robots.txt sans ligne Sitemap', 'robots.txt has no Sitemap line')
              : t(l, 'robots.txt correct', 'Valid robots.txt'),
      list(d.sitemaps).map(str).join(' · '),
      d.found
        ? t(
            l,
            'Autorisez les pages à indexer et ajoutez « Sitemap: https://(votre site)/sitemap.xml ».',
            'Allow the pages you want indexed and add “Sitemap: https://(your site)/sitemap.xml”.',
          )
        : t(
            l,
            'Créez /robots.txt avec « User-agent: * », « Allow: / » et la ligne Sitemap.',
            'Create /robots.txt with “User-agent: *”, “Allow: /” and the Sitemap line.',
          ),
    ),
  csp: (d, s, l) =>
    D(
      s === 'fail'
        ? t(l, 'Pas de Content-Security-Policy', 'No Content-Security-Policy')
        : s === 'warn'
          ? t(l, 'CSP avec unsafe-inline', 'CSP with unsafe-inline')
          : t(l, 'Content-Security-Policy en place', 'Content-Security-Policy in place'),
      d.value ? str(d.value) : '',
      t(
        l,
        "Définissez une CSP stricte (default-src 'self'), sans unsafe-inline pour les scripts : la meilleure défense contre le XSS.",
        "Set a strict CSP (default-src 'self') without unsafe-inline for scripts: the best defence against XSS.",
      ),
    ),
  x_frame_options: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Protection contre le clickjacking', 'Clickjacking protection')
        : t(l, 'Page intégrable dans une iframe', 'Page can be framed'),
      d.value ? `X-Frame-Options: ${str(d.value)}` : d.frameAncestors ? 'CSP frame-ancestors' : '',
      "X-Frame-Options: SAMEORIGIN (ou CSP frame-ancestors 'self')",
    ),
  x_content_type_options: (_d, s, l) =>
    D(
      s === 'pass'
        ? 'X-Content-Type-Options: nosniff'
        : t(l, 'X-Content-Type-Options absent', 'X-Content-Type-Options missing'),
      '',
      'X-Content-Type-Options: nosniff',
    ),
  referrer_policy: (d, s, l) =>
    D(
      s === 'fail'
        ? t(l, 'Referrer-Policy absent', 'Referrer-Policy missing')
        : `Referrer-Policy: ${str(d.value)}`,
      '',
      'Referrer-Policy: strict-origin-when-cross-origin',
    ),
  permissions_policy: (d, s, l) =>
    D(
      s === 'fail'
        ? t(l, 'Permissions-Policy absent', 'Permissions-Policy missing')
        : t(l, 'Permissions-Policy en place', 'Permissions-Policy in place'),
      d.value ? str(d.value) : '',
      'Permissions-Policy: camera=(), microphone=(), geolocation=()',
    ),
  a11y_labels: (d, s, l) =>
    D(
      s === 'info'
        ? t(l, 'Aucun champ de formulaire', 'No form field')
        : num(d.unlabeled)
          ? t(
              l,
              `${num(d.unlabeled)} champ(s) sans étiquette sur ${num(d.total)}`,
              `${num(d.unlabeled)} of ${num(d.total)} field(s) without a label`,
            )
          : t(
              l,
              `Tous les champs ont une étiquette (${num(d.total)})`,
              `All fields have a label (${num(d.total)})`,
            ),
      list(d.examples).map(str).join(' · '),
      t(
        l,
        'Associez un <label for="…"> à chaque champ (WCAG 1.3.1, 4.1.2) ; le placeholder ne suffit pas.',
        'Give every field a <label for="…"> (WCAG 1.3.1, 4.1.2); a placeholder is not enough.',
      ),
    ),
  a11y_landmarks: (d, s, l) =>
    D(
      num(d.main) !== 1
        ? t(l, `Zone principale <main> : ${num(d.main)}`, `<main> landmark: ${num(d.main)}`)
        : s === 'warn'
          ? t(l, 'Pas de <nav>', 'No <nav>')
          : t(l, 'Repères de navigation présents', 'Landmarks present'),
      `main ${num(d.main)} · nav ${num(d.nav)} · header ${num(d.header)} · footer ${num(d.footer)}`,
      t(
        l,
        'Structurez la page avec header, nav, un seul main et footer : les lecteurs d’écran s’y déplacent directement.',
        'Structure the page with header, nav, a single main and footer: screen readers jump between them.',
      ),
    ),
  a11y_skip_link: (_d, s, l) =>
    D(
      s === 'pass'
        ? t(
            l,
            'Lien interne présent (lien d’évitement probable)',
            'In-page link found (likely a skip link)',
          )
        : t(l, 'Pas de lien d’évitement', 'No skip link'),
      '',
      t(
        l,
        'Ajoutez en début de page <a href="#contenu">Aller au contenu</a>, visible au focus (WCAG 2.4.1).',
        'Add <a href="#content">Skip to content</a> first in the page, visible on focus (WCAG 2.4.1).',
      ),
    ),
};

export function describeCheck(check: SeoCheck, lang: Lang): Described {
  const writer = WRITERS[check.id];
  return writer ? writer(check.data ?? {}, check.status, lang) : D(check.id);
}
