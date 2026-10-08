// Données que le terminal interactif consulte : un extrait de content.js, sérialisé dans le HTML (îlot hydraté).
import { LANGS, PROFILE } from '../../data/content.js';

/** @param {object} t  PORTFOLIO_DATA[lang]   @param {object[]} posts  articles de la langue ({ slug, title, date, readingTime }) */
export function terminalData(lang, t, posts = []) {
  return {
    lang,
    role: t.hero.role,
    boot: t.hero.terminal,
    about: t.about,
    skills: t.skills.map((s) => ({ category: s.category, items: s.items })),
    experiences: t.experiences.map((e) => ({ role: e.role, company: e.company, location: e.location, date: e.date })),
    projects: t.projects.map((p) => ({ title: p.title, href: p.href ?? null, tags: p.tags })),
    education: t.education,
    languagesInfo: t.languagesInfo,
    posts: posts.slice(0, 5).map((p) => ({ title: p.title, slug: p.slug })),
    paths: { blog: LANGS[lang].blog, tools: LANGS[lang].tools, otherHome: LANGS[LANGS[lang].other].home, cv: t.hero.cvLink },
    links: { github: PROFILE.github, linkedin: PROFILE.linkedin, email: PROFILE.email },
    location: PROFILE.location,
    name: PROFILE.name,
  };
}
