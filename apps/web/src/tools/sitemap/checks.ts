// Vérificateur de sitemap : forme de la réponse de tools.php et rédaction de chaque contrôle (FR/EN).
// tests/unit/tools/sitemap.test.ts vérifie, en lisant SitemapChecker.php, que chaque contrôle du serveur est rédigé.
import type { Lang } from '../../lib/i18n';
import { list, num, str } from '../server/types';
import type { CheckStatus, Described, ServerCheck, ServerReport } from '../server/types';

export interface SitemapFile {
  url: string;
  status: number | null;
  error: string | null;
  contentType: string | null;
  bytes: number;
  uncompressedBytes: number;
  gzip: boolean;
  wellFormed: boolean;
  parseError: string | null;
  type: string | null;
  count: number;
  depth: number;
}

export interface SampleRow {
  url: string;
  status: number | null;
  finalUrl: string | null;
  redirects: number;
  noindex: boolean;
  canonical: string | null;
  canonicalMismatch: boolean;
  error: string | null;
}

export interface SitemapReport extends ServerReport {
  discovery: { method: 'direct' | 'robots' | 'default'; robotsFound: boolean; declared: string[] };
  files: SitemapFile[];
  urls: { total: number; unique: number };
  sample: SampleRow[];
}

type Writer = (d: Record<string, unknown>, status: CheckStatus, lang: Lang) => Described;
const t = (lang: Lang, fr: string, en: string) => (lang === 'fr' ? fr : en);
const D = (title: string, detail = '', fix = ''): Described => ({ title, detail, fix });
const examples = (d: Record<string, unknown>) => list(d.examples).map(str).join(' · ');
const size = (bytes: number) =>
  bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} Mio`
    : `${Math.max(1, Math.round(bytes / 1024))} Kio`;

export const WRITERS: Record<string, Writer> = {
  robots_sitemap: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Sitemap déclaré dans robots.txt', 'Sitemap declared in robots.txt')
        : d.robotsStatus === 200
          ? t(l, 'robots.txt ne déclare pas de sitemap', 'robots.txt declares no sitemap')
          : t(l, 'Pas de robots.txt', 'No robots.txt'),
      list(d.declared).map(str).join(' · '),
      t(
        l,
        'Ajoutez la ligne « Sitemap: https://(votre site)/sitemap.xml » dans robots.txt : tous les moteurs le trouveront.',
        'Add “Sitemap: https://(your site)/sitemap.xml” to robots.txt so every search engine finds it.',
      ),
    ),
  sitemap_found: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Sitemap trouvé', 'Sitemap found')
        : t(l, 'Aucun sitemap trouvé', 'No sitemap found'),
      [str(d.url), d.status ? `HTTP ${num(d.status)}` : str(d.error)].filter(Boolean).join(' · '),
      t(
        l,
        'Publiez un sitemap.xml à la racine (la plupart des CMS le génèrent) et déclarez-le dans robots.txt et la Search Console.',
        'Publish a sitemap.xml at the root (most CMSs generate one) and declare it in robots.txt and Search Console.',
      ),
    ),
  files_status: (d, s, l) => {
    const failed = list(d.failed).map((f) => {
      const r = f as Record<string, unknown>;
      return `${r.status ? `HTTP ${num(r.status)}` : str(r.error)} ${str(r.url)}`;
    });
    return D(
      s === 'pass'
        ? t(l, `${num(d.total)} fichier(s) lu(s)`, `${num(d.total)} file(s) read`)
        : t(
            l,
            `${failed.length} fichier(s) inaccessible(s)`,
            `${failed.length} unreachable file(s)`,
          ),
      [
        failed.join(' · '),
        num(d.skipped)
          ? t(
              l,
              `${num(d.skipped)} sous-sitemap(s) non lu(s) (limite de 10 fichiers).`,
              `${num(d.skipped)} child sitemap(s) not read (10-file limit).`,
            )
          : '',
      ]
        .filter(Boolean)
        .join(' '),
      t(
        l,
        'Chaque sitemap déclaré doit répondre 200 : corrigez ou retirez les adresses en erreur.',
        'Every declared sitemap must return 200: fix or remove failing addresses.',
      ),
    );
  },
  xml_valid: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'XML bien formé', 'Well-formed XML')
        : t(l, 'XML invalide', 'Invalid XML'),
      list(d.invalid)
        .map((f) => {
          const r = f as Record<string, unknown>;
          const err = str(r.error);
          return `${str(r.url)} : ${err === 'doctype' ? t(l, 'DOCTYPE refusé', 'DOCTYPE refused') : err === 'gzip' ? t(l, 'gzip illisible', 'unreadable gzip') : err}`;
        })
        .join(' · '),
      t(
        l,
        'Corrigez la syntaxe (balise non fermée, caractère & non échappé en &amp;…). Un sitemap illisible est ignoré en entier.',
        'Fix the syntax (unclosed tag, & not escaped as &amp;…). An unreadable sitemap is ignored entirely.',
      ),
    ),
  protocol: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Conforme au protocole sitemaps.org', 'Compliant with the sitemaps.org protocol')
        : t(l, 'Racine ou namespace non conforme', 'Non-compliant root or namespace'),
      list(d.invalid)
        .map((f) => {
          const r = f as Record<string, unknown>;
          return `${str(r.url)} : <${str(r.root) || '?'}>`;
        })
        .join(' · '),
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"> (ou <sitemapindex>)',
    ),
  content_type: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Type de contenu XML', 'XML content type')
        : t(l, 'Type de contenu inattendu', 'Unexpected content type'),
      list(d.types).map(str).join(', '),
      t(
        l,
        'Servez le sitemap en application/xml (ou application/gzip pour un .xml.gz).',
        'Serve the sitemap as application/xml (or application/gzip for a .xml.gz).',
      ),
    ),
  limits: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Dans les limites du protocole', 'Within protocol limits')
        : t(l, 'Fichier au-delà des limites', 'File over the limits'),
      t(
        l,
        `Plus gros fichier : ${size(num(d.largestBytes))} · jusqu’à ${num(d.mostUrls)} URL par fichier.`,
        `Largest file: ${size(num(d.largestBytes))} · up to ${num(d.mostUrls)} URLs per file.`,
      ),
      t(
        l,
        'Découpez en plusieurs fichiers réunis par un index (50 000 URL et 50 Mio au plus par fichier).',
        'Split into several files gathered by an index (at most 50,000 URLs and 50 MiB per file).',
      ),
    ),
  compression: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Sitemap compressé', 'Compressed sitemap')
        : t(l, 'Sitemap non compressé', 'Uncompressed sitemap'),
      t(
        l,
        `${num(d.compressed)} fichier(s) compressé(s) sur ${num(d.files)}.`,
        `${num(d.compressed)} of ${num(d.files)} file(s) compressed.`,
      ),
      t(
        l,
        'Activez gzip côté serveur ou publiez un .xml.gz : un gros sitemap se télécharge bien plus vite.',
        'Enable gzip on the server or publish a .xml.gz: a large sitemap downloads much faster.',
      ),
    ),
  structure: (d, _s, l) =>
    D(
      t(
        l,
        `${num(d.files)} fichier(s), dont ${num(d.indexes)} index`,
        `${num(d.files)} file(s), including ${num(d.indexes)} index`,
      ),
      num(d.skipped)
        ? t(
            l,
            `${num(d.skipped)} fichier(s) non lu(s) (limite de l’outil).`,
            `${num(d.skipped)} file(s) not read (tool limit).`,
          )
        : '',
    ),
  urls_present: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, `${num(d.total)} URL déclarée(s)`, `${num(d.total)} URL(s) declared`)
        : t(l, 'Aucune URL déclarée', 'No URL declared'),
      s === 'pass' ? t(l, `${num(d.unique)} distincte(s).`, `${num(d.unique)} distinct.`) : '',
      t(
        l,
        'Le sitemap doit lister les pages à indexer, chacune dans <url><loc>…</loc></url>.',
        'The sitemap must list the pages to index, each in <url><loc>…</loc></url>.',
      ),
    ),
  loc_valid: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Toutes les <loc> sont des URL absolues', 'Every <loc> is an absolute URL')
        : t(l, `${num(d.count)} <loc> invalide(s)`, `${num(d.count)} invalid <loc>`),
      examples(d),
      t(
        l,
        'Chaque <loc> doit être une URL complète (https://…), sans espace, avec & écrit &amp;.',
        'Every <loc> must be a full URL (https://…), without spaces, with & written &amp;.',
      ),
    ),
  loc_same_host: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, `Toutes les URL sont sur ${str(d.host)}`, `All URLs are on ${str(d.host)}`)
        : t(
            l,
            `${num(d.count)} URL hors de ${str(d.host)}`,
            `${num(d.count)} URL(s) outside ${str(d.host)}`,
          ),
      examples(d),
      t(
        l,
        'Un sitemap ne doit lister que des pages de son propre site (même hôte).',
        'A sitemap should only list pages of its own site (same host).',
      ),
    ),
  loc_https: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Toutes les URL sont en HTTPS', 'All URLs use HTTPS')
        : t(l, `${num(d.count)} URL en http://`, `${num(d.count)} http:// URL(s)`),
      examples(d),
      t(
        l,
        'Listez directement les adresses https:// (celles qui ne redirigent pas).',
        'List the https:// addresses directly (those that do not redirect).',
      ),
    ),
  loc_duplicates: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Aucun doublon', 'No duplicates')
        : t(l, `${num(d.count)} doublon(s)`, `${num(d.count)} duplicate(s)`),
      examples(d),
      t(l, 'Chaque URL ne doit figurer qu’une fois.', 'Each URL should appear only once.'),
    ),
  loc_fragments: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Aucune ancre (#) dans les URL', 'No anchors (#) in URLs')
        : t(l, `${num(d.count)} URL avec ancre (#)`, `${num(d.count)} URL(s) with an anchor (#)`),
      examples(d),
      t(
        l,
        'Retirez la partie #… : elle désigne la même page.',
        'Remove the #… part: it points to the same page.',
      ),
    ),
  lastmod: (d, s, l) =>
    D(
      num(d.with) === 0
        ? t(l, 'Aucune date <lastmod>', 'No <lastmod> date')
        : s === 'pass'
          ? t(
              l,
              `Dates <lastmod> valides (${num(d.with)} / ${num(d.total)})`,
              `Valid <lastmod> dates (${num(d.with)} / ${num(d.total)})`,
            )
          : t(
              l,
              `${num(d.invalid)} date(s) invalide(s), ${num(d.future)} dans le futur`,
              `${num(d.invalid)} invalid date(s), ${num(d.future)} in the future`,
            ),
      examples(d),
      t(
        l,
        'Indiquez la date de dernière modification réelle au format W3C (2026-10-09 ou 2026-10-09T14:30:00+02:00) : Google s’en sert si elle est fiable.',
        'Give the real last-modified date in W3C format (2026-10-09 or 2026-10-09T14:30:00+02:00): Google uses it when it is reliable.',
      ),
    ),
  priority_changefreq: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Pas de <priority> ni de <changefreq>', 'No <priority> or <changefreq>')
        : t(
            l,
            '<priority> et <changefreq> sont ignorés par Google',
            '<priority> and <changefreq> are ignored by Google',
          ),
      s === 'pass'
        ? ''
        : t(
            l,
            `${num(d.priority)} <priority>, ${num(d.changefreq)} <changefreq>${num(d.priorityInvalid) ? ` (${num(d.priorityInvalid)} priorité(s) hors 0,0–1,0)` : ''}.`,
            `${num(d.priority)} <priority>, ${num(d.changefreq)} <changefreq>${num(d.priorityInvalid) ? ` (${num(d.priorityInvalid)} priority value(s) outside 0.0–1.0)` : ''}.`,
          ),
      t(
        l,
        'Sans effet sur Google : vous pouvez les retirer pour alléger le fichier.',
        'No effect on Google: you can remove them to lighten the file.',
      ),
    ),
  robots_blocked: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Aucune URL bloquée par robots.txt', 'No URL blocked by robots.txt')
        : t(
            l,
            `${num(d.count)} URL bloquée(s) par robots.txt`,
            `${num(d.count)} URL(s) blocked by robots.txt`,
          ),
      examples(d),
      t(
        l,
        'Contradiction : retirez ces pages du sitemap, ou autorisez-les dans robots.txt.',
        'Contradiction: remove these pages from the sitemap, or allow them in robots.txt.',
      ),
    ),
  sample_status: (d, s, l) =>
    D(
      s === 'pass'
        ? t(
            l,
            `${num(d.checked)} URL testées : toutes répondent`,
            `${num(d.checked)} URLs tested: all respond`,
          )
        : t(
            l,
            `${num(d.errors)} URL en erreur sur ${num(d.checked)} testées`,
            `${num(d.errors)} failing URL(s) out of ${num(d.checked)} tested`,
          ),
      '',
      t(
        l,
        'Retirez du sitemap les pages supprimées (4xx) et corrigez les erreurs serveur (5xx).',
        'Remove deleted pages (4xx) from the sitemap and fix server errors (5xx).',
      ),
    ),
  sample_redirects: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Aucune URL redirigée', 'No redirected URL')
        : t(l, `${num(d.count)} URL redirigée(s)`, `${num(d.count)} redirected URL(s)`),
      '',
      t(
        l,
        'Listez l’adresse finale de chaque page, pas une adresse qui redirige.',
        'List each page’s final address, not one that redirects.',
      ),
    ),
  sample_noindex: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Aucune URL en noindex', 'No noindex URL')
        : t(l, `${num(d.count)} URL en noindex`, `${num(d.count)} noindex URL(s)`),
      '',
      t(
        l,
        'Une page en noindex n’a rien à faire dans le sitemap : retirez-la, ou retirez le noindex.',
        'A noindex page does not belong in the sitemap: remove it, or remove the noindex.',
      ),
    ),
  sample_canonical: (d, s, l) =>
    D(
      s === 'pass'
        ? t(l, 'Canonicals cohérents', 'Consistent canonicals')
        : t(
            l,
            `${num(d.count)} URL dont le canonical désigne une autre page`,
            `${num(d.count)} URL(s) whose canonical points elsewhere`,
          ),
      '',
      t(
        l,
        'Le sitemap doit lister les adresses canoniques : remplacez ces URL par celle de leur canonical.',
        'The sitemap should list canonical addresses: replace these URLs with their canonical.',
      ),
    ),
};

export function describeCheck(check: ServerCheck, lang: Lang): Described {
  const writer = WRITERS[check.id];
  return writer ? writer(check.data ?? {}, check.status, lang) : D(check.id);
}
