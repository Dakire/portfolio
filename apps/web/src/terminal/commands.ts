// Interpréteur du terminal de l'accueil : fonctions pures, sans DOM (porté du terminal de legacy/, testé par Vitest).
// Une commande retourne des lignes à afficher et, éventuellement, une action que l'interface exécute
// (défilement, thème, langue, ouverture d'une page ou du CV…).
//
//   run('skills', { s, d })  ->  { lines: [[{ t: 'Réseau & systèmes', kind: 'accent' }], …], action?: { type, … } }
import type { TerminalStrings } from './text';

export type SegmentKind = 'accent' | 'dim' | 'error';
export interface Segment {
  t: string;
  kind?: SegmentKind;
  href?: string;
  external?: boolean;
}
export type Line = Segment[];

export type Action =
  | { type: 'goto'; id: string; fallback?: string }
  | { type: 'theme'; value: 'dark' | 'light' | 'auto' }
  | { type: 'open'; href: string }
  | { type: 'navigate'; href: string }
  | { type: 'cursor'; value: 'on' | 'off' }
  | { type: 'clear' };

export interface Result {
  lines: Line[];
  action?: Action;
}

/** Données consultées par le terminal : un extrait du contenu du site, sérialisé dans la page (voir data.ts). */
export interface TerminalData {
  lang: 'fr' | 'en';
  name: string;
  role: string;
  location: string;
  about: string;
  stack: string;
  skills: { category: string; items: string }[];
  experiences: { role: string; company: string; date: string }[];
  projects: { title: string; tags: string[]; href?: string }[];
  tools: { id: string; name: string; href: string }[];
  posts: { title: string; slug: string; href: string }[];
  links: { email: string; github: string; linkedin: string };
  paths: { blog: string; tools: string; contact: string; cv: string; otherHome: string };
}

export interface Context {
  s: TerminalStrings;
  d: TerminalData;
  theme?: 'dark' | 'light';
}

/** Commandes listées par help, dans l'ordre d'affichage. */
export const COMMANDS = [
  'help',
  'about',
  'whoami',
  'skills',
  'experience',
  'projects',
  'tools',
  'open',
  'blog',
  'contact',
  'cv',
  'links',
  'ls',
  'cat',
  'goto',
  'theme',
  'lang',
  'neofetch',
  'cursor',
  'clear',
] as const;
export type Command = (typeof COMMANDS)[number];

/** Commandes cachées (easter eggs) : complétées et exécutées, absentes de help. */
const HIDDEN = ['sudo', 'rm', 'exit', 'pwd', 'date', 'echo'] as const;

export const FILES = ['about.txt', 'stack.txt', 'contact.txt'] as const;
export const SECTIONS = ['home', 'skills', 'projects', 'tools', 'blog', 'contact'] as const;

const fill = (text: string, params: Record<string, string> = {}): string =>
  text.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? '');
const seg = (t: string, kind?: SegmentKind): Segment => (kind ? { t, kind } : { t });
const link = (t: string, href: string, external = false): Segment =>
  external ? { t, href, external } : { t, href };
// Le retour à la ligne est laissé au CSS : le panneau n'a pas de largeur fixe.
const lines = (text: string, kind?: SegmentKind): Line[] => [[seg(text, kind)]];

/** Candidat unique : complété en entier ; plusieurs : seulement jusqu'à leur préfixe commun (comme un shell). */
function pick(
  candidates: readonly string[],
  prefix: string,
): { text: string; unique: boolean } | null {
  const found = candidates.filter((c) => c.startsWith(prefix));
  if (found.length === 1) return { text: found[0]!, unique: true };
  let common = found[0] ?? '';
  for (const c of found) while (!c.startsWith(common)) common = common.slice(0, -1);
  return common.length > prefix.length ? { text: common, unique: false } : null;
}

/** Complétion par Tab : le texte complété, ou null s'il n'y a rien à compléter (Tab quitte alors le champ). */
export function complete(raw: string, d?: Pick<TerminalData, 'tools'>): string | null {
  const m = /^(\S*)(\s+)?(.*)$/.exec(raw.trimStart());
  if (!m) return null;
  const [, cmd = '', space, rest = ''] = m;
  if (!space) {
    const done = pick([...COMMANDS, ...HIDDEN], cmd.toLowerCase());
    return done ? (done.unique ? `${done.text} ` : done.text) : null;
  }
  const args: Record<string, readonly string[]> = {
    cat: FILES,
    goto: SECTIONS,
    theme: ['dark', 'light', 'auto'],
    cursor: ['on', 'off'],
    lang: ['fr', 'en'],
    ls: ['blog'],
    open: d?.tools.map((tool) => tool.id) ?? [],
  };
  const candidates = args[cmd.toLowerCase()];
  if (!candidates) return null;
  const done = pick(candidates, rest.toLowerCase());
  return done ? `${cmd} ${done.text}` : null;
}

export function run(raw: string, { s, d, theme = 'dark' }: Context): Result {
  const input = raw.trim();
  if (!input) return { lines: [] };
  const [cmd = '', ...args] = input.split(/\s+/);
  const name = cmd.toLowerCase();
  const arg = args[0]?.toLowerCase();

  switch (name) {
    case 'help':
    case '?':
      return {
        lines: [
          [seg(s.helpTitle, 'accent')],
          ...COMMANDS.map((c) => [seg(`  ${c.padEnd(11)}`, 'accent'), seg(s.help[c])]),
          [seg(s.helpKeys, 'dim')],
        ],
      };
    case 'whoami':
      return {
        lines: [
          [seg(`${d.name.toLowerCase()} · ${d.role.toLowerCase()}`)],
          [seg(d.location, 'dim')],
        ],
      };
    case 'about':
      return { lines: lines(d.about) };
    case 'skills':
      return {
        lines: d.skills.flatMap((k) => [[seg(`▸ ${k.category}`, 'accent')], [seg(`  ${k.items}`)]]),
      };
    case 'experience':
      return {
        lines: d.experiences.flatMap((e) => [
          [seg(`▸ ${e.role}`, 'accent')],
          [seg(`  ${e.company}`)],
          [seg(`  ${e.date}`, 'dim')],
        ]),
      };
    case 'projects':
      return {
        lines: d.projects.flatMap((p) => [
          [seg('▸ ', 'accent'), p.href ? link(p.title, p.href, true) : seg(p.title)],
          [seg(`  ${p.tags.join(' · ')}`, 'dim')],
        ]),
      };
    case 'tools':
      return {
        lines: [
          ...d.tools.map((tool) => [
            seg(`  ${tool.id.padEnd(14)}`, 'accent'),
            link(tool.name, tool.href),
          ]),
          [seg(s.toolsHint, 'dim')],
        ],
      };
    case 'open': {
      if (!arg) return { lines: [[seg(s.openUsage, 'dim')]] };
      const tool = d.tools.find((x) => x.id === arg);
      if (!tool) return { lines: [[seg(fill(s.openMissing, { tool: args[0]! }), 'error')]] };
      return {
        lines: [[seg(fill(s.opening, { name: tool.name }), 'dim')]],
        action: { type: 'navigate', href: tool.href },
      };
    }
    case 'blog':
      return {
        lines: d.posts.length
          ? [
              ...d.posts.map((p) => [seg('▸ ', 'accent'), link(p.title, p.href)]),
              [seg('→ ', 'dim'), link(s.openBlog, d.paths.blog)],
            ]
          : [[seg(s.noPosts, 'dim')]],
      };
    case 'contact':
      return {
        lines: [
          [seg('▸ e-mail  ', 'accent'), link(d.links.email, `mailto:${d.links.email}`)],
          [seg('▸ form    ', 'accent'), link(s.contactForm, d.paths.contact)],
        ],
        action: { type: 'goto', id: 'contact' },
      };
    case 'links':
      return {
        lines: [
          [seg('▸ GitHub    ', 'accent'), link(d.links.github, d.links.github, true)],
          [seg('▸ LinkedIn  ', 'accent'), link(d.links.linkedin, d.links.linkedin, true)],
          [seg('▸ CV        ', 'accent'), link(s.cvName, d.paths.cv)],
          [seg('▸ Tools     ', 'accent'), link(s.allTools, d.paths.tools)],
        ],
      };
    case 'cv':
      return {
        lines: [[seg(s.cvOpening, 'dim'), link(s.cvName, d.paths.cv)]],
        action: { type: 'open', href: d.paths.cv },
      };
    case 'ls': {
      const target = args[0];
      if (!target || ['.', '~', '~/'].includes(target)) return { lines: [[seg(s.files)]] };
      if (['blog', 'blog/', '~/blog', '~/blog/'].includes(target))
        return {
          lines: d.posts.length
            ? d.posts.map((p) => [link(p.slug, p.href)])
            : [[seg(s.noPosts, 'dim')]],
        };
      return { lines: [[seg(fill(s.lsMissing, { file: target }), 'error')]] };
    }
    case 'cat': {
      if (!arg) return { lines: [[seg(s.catUsage, 'dim')]] };
      const file = arg.replace(/^(~\/|\.\/)/, '');
      if (file === 'about.txt') return { lines: lines(d.about) };
      if (file === 'stack.txt') return { lines: lines(d.stack) };
      if (file === 'contact.txt')
        return { lines: [[seg(d.links.email)], [seg(d.location, 'dim')]] };
      return { lines: [[seg(fill(s.catMissing, { file: args[0]! }), 'error')]] };
    }
    case 'goto':
    case 'cd': {
      if (!arg)
        return { lines: [[seg(fill(s.gotoUsage, { sections: SECTIONS.join(', ') }), 'dim')]] };
      const wanted = arg.replace(/^~?\//, '').replace(/\/$/, '');
      const id = (SECTIONS as readonly string[]).includes(wanted)
        ? wanted
        : SECTIONS.find((k) => s.sections[k].toLowerCase() === wanted);
      if (!id) return { lines: [[seg(fill(s.gotoMissing, { section: args[0]! }), 'error')]] };
      return {
        lines: [
          [seg(fill(s.gotoDone, { section: s.sections[id as (typeof SECTIONS)[number]] }), 'dim')],
        ],
        action: { type: 'goto', id },
      };
    }
    case 'theme': {
      if (!arg) return { lines: [[seg(fill(s.themeNow, { theme: s.themes[theme] }), 'dim')]] };
      const next = arg === 'toggle' ? (theme === 'dark' ? 'light' : 'dark') : arg;
      if (next !== 'dark' && next !== 'light' && next !== 'auto')
        return { lines: [[seg(s.themeUsage, 'error')]] };
      return {
        lines: [[seg(fill(s.themeSet, { theme: s.themes[next] }), 'dim')]],
        action: { type: 'theme', value: next },
      };
    }
    case 'lang': {
      if (arg !== 'fr' && arg !== 'en') return { lines: [[seg(s.langUsage, 'dim')]] };
      if (arg === d.lang) return { lines: [[seg(s.langSame, 'dim')]] };
      return {
        lines: [[seg(fill(s.langSwitching, { lang: s.languages[arg] }), 'dim')]],
        action: { type: 'navigate', href: d.paths.otherHome },
      };
    }
    case 'cursor': {
      if (arg !== 'on' && arg !== 'off') return { lines: [[seg(s.cursorUsage, 'dim')]] };
      return {
        lines: [[seg(arg === 'on' ? s.cursorOn : s.cursorOff, 'dim')]],
        action: { type: 'cursor', value: arg },
      };
    }
    case 'neofetch': {
      const rows: [string, string][] = [
        [s.neofetch.user, d.name],
        [s.neofetch.role, d.role],
        [s.neofetch.location, d.location],
        [s.neofetch.stack, d.stack],
        [s.neofetch.host, 'grichard.eu (OVH, PHP 8.5)'],
        [s.neofetch.shell, 'grsh 1.0'],
        [s.neofetch.theme, s.themes[theme]],
      ];
      const logo = [
        '   ____ ',
        '  / ___|',
        ' | |  _ ',
        ' | |_| |',
        '  \\____|',
        '        ',
        '        ',
      ];
      return {
        lines: rows.map(([label, value], i) => [
          seg(`${logo[i] ?? ''}  `, 'accent'),
          seg(`${label.padEnd(10)}`, 'accent'),
          seg(value),
        ]),
      };
    }
    case 'clear':
      return { lines: [], action: { type: 'clear' } };
    case 'pwd':
      return { lines: [[seg('/home/guillaume/portfolio')]] };
    case 'date':
      return {
        lines: [
          [
            seg(
              new Date().toLocaleString(d.lang === 'fr' ? 'fr-FR' : 'en-GB', {
                dateStyle: 'full',
                timeStyle: 'short',
              }),
            ),
          ],
        ],
      };
    case 'echo':
      return { lines: [[seg(args.join(' '))]] };
    case 'sudo':
      return { lines: [[seg(s.sudo, 'error')]] };
    case 'rm':
      return { lines: [[seg(s.rm, 'error')]] };
    case 'exit':
      return { lines: [[seg(s.exit, 'dim')]] };
    default:
      return { lines: [[seg(fill(s.notFound, { cmd }), 'error')]] };
  }
}
