// Dates de dernière modification réelles (<lastmod> du sitemap) : celles du dernier commit qui touche les fichiers
// sources d'une page. Jamais la date du build. Sans historique Git (clone superficiel), aucune date : mieux vaut
// pas de <lastmod> qu'un <lastmod> faux. Le déploiement et la CI clonent donc l'historique complet (fetch-depth: 0).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

function git(args) {
  try {
    const out = execFileSync('git', args, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out.split('\n')[0]) ? out.split('\n')[0] : undefined;
  } catch {
    return undefined;
  }
}

/** Date (AAAA-MM-JJ) du dernier commit touchant ces chemins. */
export const gitDate = (...paths) =>
  git(['log', '-1', '--format=%cs', '--', ...paths.filter((p) => existsSync(p))]);

const newest = (dates) => dates.filter(Boolean).sort().at(-1);

/** Outils : un dossier par outil dans src/tools. Les composants communs sont exclus : ils dateraient toutes les pages du même jour. */
function toolDates(dates) {
  const registry = readFileSync('src/tools/registry.ts', 'utf-8');
  const all = [];
  for (const m of registry.matchAll(
    /id:\s*'([\w-]+)'[\s\S]*?slug:\s*\{\s*fr:\s*'([\w-]+)',\s*en:\s*'([\w-]+)'/g,
  )) {
    const [, id, fr, en] = m;
    // Les outils « serveur » (seo, sitemap) partagent aussi src/tools/server.
    const date = newest([
      gitDate(`src/tools/${id}`),
      id === 'seo' || id === 'sitemap' ? gitDate('src/tools/server') : undefined,
    ]);
    if (!date) continue;
    dates.set(`/outils/${fr}/`, date);
    dates.set(`/en/tools/${en}/`, date);
    all.push(date);
  }
  const hub = newest(all);
  if (hub) {
    dates.set('/outils/', hub);
    dates.set('/en/tools/', hub);
  }
}

/** Cheatsheets : JSON généré et commité de chaque référence (il change avec ses sources YAML). */
function referenceDates(dates) {
  const { refs } = JSON.parse(readFileSync('public/data/reference/index.json', 'utf-8'));
  const all = [];
  for (const r of refs) {
    const date = newest([gitDate(`public${r.file}`)]);
    if (!date) continue;
    dates.set(`${r.lang === 'en' ? '/en' : ''}/cheatsheets/${r.id}/`, date);
    all.push([r.lang, date]);
  }
  for (const lang of ['fr', 'en']) {
    const hub = newest(all.filter(([l]) => l === lang).map(([, d]) => d));
    if (hub) dates.set(lang === 'en' ? '/en/cheatsheets/' : '/cheatsheets/', hub);
  }
}

/** Réalisations : les lignes de chaque entrée dans profile.ts (git log -L), plus la page de détail. */
function projectDates(dates) {
  const file = 'src/data/profile.ts';
  const lines = readFileSync(file, 'utf-8').split('\n');
  const bySlug = new Map();
  lines.forEach((line, i) => {
    const slug = /^\s+slug:\s*'([\w-]+)',/.exec(line)?.[1];
    if (!slug) return;
    let end = i;
    while (end < lines.length && !/^\s{6}\},?$/.test(lines[end])) end++;
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), `${i}`, `${end + 1}`]);
  });
  const all = [];
  for (const [slug, marks] of bySlug) {
    const ranges = [];
    for (let k = 0; k < marks.length; k += 2)
      ranges.push(`-L${Number(marks[k])},${marks[k + 1]}:${file}`);
    const date = newest([git(['log', '-1', '--format=%cs', '-s', ...ranges])]);
    if (!date) continue;
    dates.set(`/projets/${slug}/`, date);
    dates.set(`/en/projects/${slug}/`, date);
    all.push(date);
  }
  const hub = newest(all);
  if (hub) {
    dates.set('/projets/', hub);
    dates.set('/en/projects/', hub);
  }
}

export function sourceDates() {
  const dates = new Map();
  toolDates(dates);
  referenceDates(dates);
  projectDates(dates);
  return dates;
}
