// Liste des images de partage à produire au build (hors articles, lus dans leur front matter) : pages du portfolio, réalisations, cheatsheets.
// Ce fichier n'est qu'un échange avec scripts/postbuild.mjs, qui le lit puis le supprime de dist/ : il n'est jamais publié.
import { PORTFOLIO_DATA } from '../data/content';
import { LANGS, UI } from '../lib/i18n';
import { REFS } from '../reference/refs';

export interface OgCard {
  slug: string;
  lang: string;
  kicker: string;
  title: string;
}

export function GET() {
  const cards: OgCard[] = [];
  for (const lang of LANGS) {
    const t = PORTFOLIO_DATA[lang];
    const nav = UI[lang].nav;
    for (const [key, title] of [
      ['about', t.aboutTitle],
      ['career', nav.career],
      ['skills', t.skillsTitle],
      ['projects', t.projectsTitle],
      ['resources', nav.resources],
      ['contact', nav.contact],
      ['cheatsheets', nav.cheatsheets],
    ] as const)
      cards.push({ slug: `page-${key}-${lang}`, lang, kicker: 'Portfolio', title });
    for (const project of t.projects)
      cards.push({
        slug: `project-${project.slug}-${lang}`,
        lang,
        kicker: lang === 'fr' ? 'Réalisation' : 'Project',
        title: project.title,
      });
  }
  for (const ref of REFS)
    cards.push({
      slug: `cheatsheet-${ref.id}`,
      lang: ref.lang,
      kicker: 'Cheatsheet',
      title: ref.h1,
    });
  return new Response(JSON.stringify(cards), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
