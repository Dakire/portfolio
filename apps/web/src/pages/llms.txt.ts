// llms.txt : présentation du site pour les assistants IA (https://llmstxt.org). Généré : aucune URL à maintenir à la main.
import { PROFILE } from '../data/content';
import { getPosts, postPath } from '../lib/blog';
import { withBase } from '../lib/base';
import { ROUTES, SITE } from '../lib/i18n';

const link = (label: string, path: string, note: string) =>
  `- [${label}](${SITE}${path}) : ${note}`;

export async function GET() {
  const [fr, en] = await Promise.all([getPosts('fr'), getPosts('en')]);
  const lines = [
    '# Guillaume Richard',
    '',
    '> Portfolio et blog technique de Guillaume Richard, Technicien Informatique et Systèmes Numériques basé à Laval (France). Domaines : administration Microsoft 365 et Google Workspace, DNS, délivrabilité des e-mails (SPF, DKIM, DMARC), migrations de messagerie, Windows Server, support IT.',
    '',
    'Le portfolio, le blog et les outils sont disponibles en français et en anglais.',
    '',
    '## Pages',
    link('Portfolio en français', ROUTES.fr.home, 'parcours, compétences, projets, contact'),
    link('Portfolio in English', ROUTES.en.home, 'same content in English'),
    link('À propos', ROUTES.fr.about, 'parcours et formation'),
    link('Compétences', ROUTES.fr.skills, 'domaines d’expertise'),
    link('Projets', ROUTES.fr.projects, 'projets techniques'),
    link(
      'Outils',
      ROUTES.fr.tools,
      'outils en ligne gratuits (DNS, ICS, réseau, JSON…), exécutés dans le navigateur',
    ),
    link(
      'Tools',
      ROUTES.en.tools,
      'free online tools (DNS, ICS, network, JSON…), run in the browser',
    ),
    link('Blog (français)', ROUTES.fr.blog, 'notes techniques'),
    link('Blog (English)', ROUTES.en.blog, 'technical notes'),
    link('Mentions légales', ROUTES.fr.legal, 'éditeur, hébergement'),
    link('Confidentialité', ROUTES.fr.privacy, 'données et cookies'),
    link('Accessibilité', ROUTES.fr.accessibility, 'déclaration d’accessibilité'),
    link('Flux RSS (français)', ROUTES.fr.rss, 'articles') +
      ` et [RSS feed (English)](${SITE}${ROUTES.en.rss})`,
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
