// llms.txt : présentation du site pour les assistants IA (https://llmstxt.org). Généré : aucune URL à maintenir à la main.
import { PORTFOLIO_DATA, PROFILE } from '../data/content';
import { getPosts, postPath } from '../lib/blog';
import { withBase } from '../lib/base';
import { ROUTES, SITE, projectPath } from '../lib/i18n';
import { REFS, refPath } from '../reference/refs';

const link = (label: string, path: string, note: string) =>
  `- [${label}](${SITE}${path}) : ${note}`;

export async function GET() {
  const [fr, en] = await Promise.all([getPosts('fr'), getPosts('en')]);
  const lines = [
    '# Guillaume Richard',
    '',
    '> Portfolio et blog technique de Guillaume Richard, Technicien Informatique et Systèmes Numériques, en France. Domaines : administration Microsoft 365 et Google Workspace, DNS, délivrabilité des e-mails (SPF, DKIM, DMARC), migrations de messagerie, Windows Server, support IT.',
    '',
    'Le portfolio, le blog et les outils sont disponibles en français et en anglais.',
    '',
    '## Pages',
    link('Portfolio en français', ROUTES.fr.home, 'parcours, compétences, projets, contact'),
    link('Portfolio in English', ROUTES.en.home, 'same content in English'),
    link('À propos', ROUTES.fr.about, 'parcours et formation'),
    link('Parcours', ROUTES.fr.career, 'expériences, formation, CV'),
    link('Compétences', ROUTES.fr.skills, 'six domaines d’expertise et leurs preuves'),
    link('Réalisations', ROUTES.fr.projects, 'projets techniques, une page par réalisation'),
    link('Career', ROUTES.en.career, 'experience, education, resume'),
    link('Projects', ROUTES.en.projects, 'technical projects, one page each'),
    link('Ressources', ROUTES.fr.resources, 'blog, outils et cheatsheets'),
    link('Resources', ROUTES.en.resources, 'blog and tools'),
    link(
      'Outils',
      ROUTES.fr.tools,
      'outils en ligne gratuits (DNS, e-mail, ICS, réseau, SEO, JSON…)',
    ),
    link('Tools', ROUTES.en.tools, 'free online tools (DNS, email, ICS, network, SEO, JSON…)'),
    link(
      'Cheatsheets (aide-mémoire de commandes)',
      '/cheatsheets/',
      'recherche de commandes : GAM, PowerShell Microsoft 365, Windows 11, Active Directory, réseau, Linux, Proxmox, Git, touches BIOS/UEFI',
    ),
    link(
      'Cheatsheets (command reference)',
      '/en/cheatsheets/',
      'BIOS/UEFI and boot menu keys by PC brand, with instant search',
    ),
    link('Blog (français)', ROUTES.fr.blog, 'notes techniques'),
    link('Blog (English)', ROUTES.en.blog, 'technical notes'),
    link('Mentions légales', ROUTES.fr.legal, 'éditeur, hébergement'),
    link('Confidentialité', ROUTES.fr.privacy, 'données et cookies'),
    link('Accessibilité', ROUTES.fr.accessibility, 'déclaration d’accessibilité'),
    link('Flux RSS (français)', ROUTES.fr.rss, 'articles') +
      ` et [RSS feed (English)](${SITE}${ROUTES.en.rss})`,
    '',
    '## Réalisations (français)',
    ...PORTFOLIO_DATA.fr.projects.map((p) => link(p.title, projectPath('fr', p.slug), p.desc)),
    '',
    '## Projects (English)',
    ...PORTFOLIO_DATA.en.projects.map((p) => link(p.title, projectPath('en', p.slug), p.desc)),
    '',
    '## Cheatsheets',
    ...REFS.map((r) => link(r.h1, refPath(r), r.description)),
    '',
    '## Articles (français)',
    ...fr.map((p) => link(p.data.title, postPath('fr', p.slug), p.data.description)),
    '',
    '## Articles (English)',
    ...en.map((p) => link(p.data.title, postPath('en', p.slug), p.data.description)),
    '',
    '## Documents',
    `- [CV en français (PDF)](${SITE}${withBase('/CV_Guillaume_Richard_FR.pdf')})`,
    `- [Resume in English (PDF)](${SITE}${withBase('/Resume_Guillaume_Richard_EN.pdf')})`,
    '',
    '## Contact',
    `- E-mail : ${PROFILE.email}`,
    `- [LinkedIn](${PROFILE.linkedin})`,
    `- [GitHub](${PROFILE.github})`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
