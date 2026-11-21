// Données du terminal : un extrait du contenu du site, calculé au build et sérialisé dans la page (attribut data-terminal).
import { PORTFOLIO_DATA, PROFILE } from '../data/content';
import { withBase } from '../lib/base';
import { getPosts, postPath } from '../lib/blog';
import { ROUTES, otherLang, projectPath, type Lang } from '../lib/i18n';
import { TOOLS, toolPath, toolUi } from '../tools/registry';
import type { TerminalData } from './commands';

export async function terminalData(lang: Lang): Promise<TerminalData> {
  const t = PORTFOLIO_DATA[lang];
  const posts = await getPosts(lang);
  return {
    lang,
    name: PROFILE.name,
    role: t.hero.role,
    location: PROFILE.location,
    about: t.about,
    stack: t.hero.terminal[1]?.out ?? '',
    skills: t.skills.map(({ category, items }) => ({ category, items })),
    experiences: t.experiences.map(({ role, company, date }) => ({ role, company, date })),
    projects: t.projects.map(({ title, tags, href, slug, desc }) => ({
      title,
      tags,
      slug,
      desc,
      url: projectPath(lang, slug),
      ...(href ? { href } : {}),
    })),
    education: t.education.map(({ title, school, date }) => ({ title, school, date })),
    tools: TOOLS.map((tool) => ({
      id: tool.id,
      name: toolUi(tool, lang).name,
      href: toolPath(tool, lang),
    })),
    posts: posts.map((p) => ({
      title: p.data.title,
      slug: p.slug,
      href: postPath(lang, p.slug),
      date: p.data.date.toISOString().slice(0, 10),
    })),
    links: { email: PROFILE.email, github: PROFILE.github, linkedin: PROFILE.linkedin },
    paths: {
      blog: ROUTES[lang].blog,
      tools: ROUTES[lang].tools,
      contact: ROUTES[lang].contact,
      cv: withBase(t.hero.cvLink),
      otherHome: ROUTES[otherLang(lang)].home,
    },
  };
}
