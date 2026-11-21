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
  | { type: 'clear' }
  | { type: 'reset' }
  | { type: 'effect'; name: 'matrix' | 'konami' };

export interface Result {
  lines: Line[];
  action?: Action;
  /** Nouveau dossier courant de l'arborescence virtuelle (absent : inchangé). */
  cwd?: string;
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
  projects: {
    title: string;
    tags: string[];
    slug?: string;
    desc?: string;
    url?: string;
    href?: string;
  }[];
  education?: { title: string; school: string; date: string }[];
  tools: { id: string; name: string; href: string }[];
  posts: { title: string; slug: string; href: string; date?: string }[];
  links: { email: string; github: string; linkedin: string };
  paths: { blog: string; tools: string; contact: string; cv: string; otherHome: string };
}

export interface Context {
  s: TerminalStrings;
  d: TerminalData;
  theme?: 'dark' | 'light';
  /** Dossier courant de l'arborescence virtuelle ('' = racine). */
  cwd?: string;
  /** Commandes déjà saisies pendant la session (pour history). */
  history?: string[];
  random?: () => number;
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
  'reset',
  'history',
  'date',
  'pwd',
  'cd',
  'education',
  'project',
  'github',
  'website',
  'banner',
  'man',
  'fortune',
] as const;
export type Command = (typeof COMMANDS)[number];

/** Commandes cachées (easter eggs) : complétées et exécutées, absentes de help. */
const HIDDEN = [
  'sudo',
  'rm',
  'exit',
  'echo',
  'matrix',
  'konami',
  'coffee',
  '418',
  'ping',
  'vim',
  '42',
] as const;

export const FILES = ['about.txt', 'stack.txt', 'contact.txt'] as const;
/** Arborescence virtuelle : dossiers de la racine. */
export const DIRS = ['about', 'skills', 'projects', 'experience', 'blog', 'contact'] as const;
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

/** Distance d'édition (suggestion en cas de faute de frappe). */
function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length]!;
}
const nearest = (word: string): string | null => {
  let best: string | null = null;
  let score = 3;
  for (const c of COMMANDS) {
    const dist = distance(word, c);
    if (dist < score) {
      score = dist;
      best = c;
    }
  }
  return best;
};

/** Normalise un chemin de l'arborescence virtuelle : renvoie le dossier ('' = racine) ou le nom d'un fichier de ce dossier. */
function resolve(cwd: string, target: string): { dir: string; file?: string } | null {
  const parts = target.startsWith('~') || target.startsWith('/') ? [] : cwd ? [cwd] : [];
  for (const raw of target.replace(/^~/, '').split('/')) {
    const part = raw.toLowerCase();
    if (!part || part === '.') continue;
    if (part === '..') {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  const [dir = '', file, extra] = parts;
  if (dir === '') return { dir: '' };
  if (extra !== undefined) return null;
  if (!(DIRS as readonly string[]).includes(dir)) {
    return parts.length === 1 && (FILES as readonly string[]).includes(dir)
      ? { dir: '', file: dir }
      : null;
  }
  return file === undefined ? { dir } : { dir, file };
}

/** Complétion par Tab : le texte complété, ou null s'il n'y a rien à compléter (Tab quitte alors le champ). */
export function complete(
  raw: string,
  d?: Partial<Pick<TerminalData, 'tools' | 'projects' | 'posts'>>,
): string | null {
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
    ls: DIRS,
    cd: [...DIRS, '..', '~'],
    man: COMMANDS,
    project: d?.projects?.flatMap((p) => (p.slug ? [p.slug] : [])) ?? [],
    blog: d?.posts?.map((p) => p.slug) ?? [],
    open: d?.tools?.map((tool) => tool.id) ?? [],
  };
  const candidates = args[cmd.toLowerCase()];
  if (!candidates) return null;
  const done = pick(candidates, rest.toLowerCase());
  return done ? `${cmd} ${done.text}` : null;
}

export function run(
  raw: string,
  { s, d, theme = 'dark', cwd = '', history = [], random = Math.random }: Context,
): Result {
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
    case 'blog': {
      if (arg) {
        const post =
          d.posts.find((x) => x.slug === arg) ?? d.posts.find((x) => x.slug.includes(arg));
        if (!post) return { lines: [[seg(fill(s.blogMissing, { slug: args[0]! }), 'error')]] };
        return {
          lines: [
            [seg('▸ ', 'accent'), link(post.title, post.href)],
            ...(post.date ? [[seg(`  ${post.date}`, 'dim')]] : []),
          ],
        };
      }
      return {
        lines: d.posts.length
          ? [
              ...d.posts.slice(0, 5).map((p) => [seg('▸ ', 'accent'), link(p.title, p.href)]),
              [seg('→ ', 'dim'), link(s.openBlog, d.paths.blog)],
            ]
          : [[seg(s.noPosts, 'dim')]],
      };
    }
    case 'project': {
      if (!arg) return { lines: [[seg(s.projectUsage, 'dim')]] };
      const p =
        d.projects.find((x) => x.slug === arg) ??
        d.projects.find((x) => (x.slug ?? '').includes(arg) || x.title.toLowerCase().includes(arg));
      if (!p) return { lines: [[seg(fill(s.projectMissing, { name: args[0]! }), 'error')]] };
      return {
        lines: [
          [seg(`▸ ${p.title}`, 'accent')],
          ...(p.desc ? [[seg(`  ${p.desc}`)]] : []),
          [seg(`  ${p.tags.join(' · ')}`, 'dim')],
          ...(p.url ? [[seg('  → ', 'dim'), link(p.url, p.url)]] : []),
          ...(p.href ? [[seg('  → ', 'dim'), link(p.href, p.href, true)]] : []),
        ],
      };
    }
    case 'education':
      return {
        lines: d.education?.length
          ? d.education.flatMap((e) => [
              [seg(`▸ ${e.title}`, 'accent')],
              [seg(`  ${e.school}`)],
              [seg(`  ${e.date}`, 'dim')],
            ])
          : [[seg(s.noEducation, 'dim')]],
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
      const where = target ? resolve(cwd, target) : { dir: cwd };
      if (!where) return { lines: [[seg(fill(s.lsMissing, { file: target ?? '' }), 'error')]] };
      if (where.file) return { lines: [[seg(where.file)]] };
      switch (where.dir) {
        case '':
          return { lines: [[seg(s.files)]] };
        case 'about':
          return { lines: [[seg('about.txt')]] };
        case 'contact':
          return { lines: [[seg('contact.txt')]] };
        case 'skills':
          return { lines: d.skills.map((k) => [seg(k.category)]) };
        case 'experience':
          return { lines: d.experiences.map((e) => [seg(`${e.role}, ${e.company}`)]) };
        case 'projects':
          return {
            lines: d.projects.map((p) => [p.url ? link(p.slug ?? p.title, p.url) : seg(p.title)]),
          };
        default:
          return {
            lines: d.posts.length
              ? d.posts.map((p) => [link(p.slug, p.href)])
              : [[seg(s.noPosts, 'dim')]],
          };
      }
    }
    case 'cat': {
      if (!arg) return { lines: [[seg(s.catUsage, 'dim')]] };
      const where = resolve(cwd, args[0]!);
      const file = where?.file ?? (where?.dir === '' ? undefined : undefined);
      const name = (file ?? args[0]!.replace(/^(~\/|\.\/)/, '')).toLowerCase();
      if (name === 'about.txt') return { lines: lines(d.about) };
      if (name === 'stack.txt') return { lines: lines(d.stack) };
      if (name === 'contact.txt')
        return { lines: [[seg(d.links.email)], [seg(d.location, 'dim')]] };
      if (where?.dir === 'projects' && where.file) return run(`project ${where.file}`, { s, d });
      if (where?.dir === 'blog' && where.file) return run(`blog ${where.file}`, { s, d });
      return { lines: [[seg(fill(s.catMissing, { file: args[0]! }), 'error')]] };
    }
    case 'cd': {
      if (!arg || arg === '~' || arg === '/') return { lines: [], cwd: '' };
      const where = resolve(cwd, args[0]!);
      if (!where) return { lines: [[seg(fill(s.cdMissing, { dir: args[0]! }), 'error')]] };
      if (where.file) return { lines: [[seg(fill(s.notDir, { file: args[0]! }), 'error')]] };
      return { lines: [], cwd: where.dir };
    }
    case 'goto': {
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
      return { lines: [[seg(`/home/guillaume/portfolio${cwd ? `/${cwd}` : ''}`)]] };
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
    case 'coffee':
    case 'cafe':
    case 'café':
      return {
        lines: [
          [seg('    ( (   ', 'accent')],
          [seg('     ) )  ', 'accent')],
          [seg('  ........', 'accent')],
          [seg('  |      |]', 'accent')],
          [seg('  \\      /', 'accent')],
          [seg("   `----'", 'accent')],
          [seg(s.coffee, 'dim')],
        ],
      };
    case '418':
      return { lines: [[seg(s.teapot, 'dim')]] };
    case 'ping':
      return { lines: [[seg(s.ping, 'dim')]] };
    case 'vim':
    case 'vi':
    case 'nano':
      return { lines: [[seg(s.vim, 'dim')]] };
    case '42':
      return { lines: [[seg(s.answer, 'dim')]] };
    case 'reset':
      return { lines: [], action: { type: 'reset' }, cwd: '' };
    case 'history':
      return {
        lines: history.length
          ? history.map((h, i) => [seg(`${String(i + 1).padStart(4)}  `, 'dim'), seg(h)])
          : [[seg(s.historyEmpty, 'dim')]],
      };
    case 'github':
      return { lines: [[seg('▸ ', 'accent'), link(d.links.github, d.links.github, true)]] };
    case 'website':
      return {
        lines: [[seg('▸ ', 'accent'), link('https://grichard.eu/', 'https://grichard.eu/')]],
      };
    case 'banner':
      return {
        lines: [
          ...[
            '  ___ ___ ___ ___ _  _   _   ___ ___ ',
            ' / __| _ \\_ _/ __| || | /_\\ | _ \\   \\',
            '| (_ |   /| | (__| __ |/ _ \\|   / |) |',
            ' \\___|_|_\\___\\___|_||_/_/ \\_\\_|_\\___/',
          ].map((row) => [seg(row, 'accent')]),
          [seg(s.tagline, 'dim')],
        ],
      };
    case 'man': {
      if (!arg) return { lines: [[seg(s.manUsage, 'dim')]] };
      const known = (COMMANDS as readonly string[]).includes(arg) ? (arg as Command) : null;
      if (!known) return { lines: [[seg(fill(s.manMissing, { cmd: args[0]! }), 'error')]] };
      return {
        lines: [
          [seg(known.toUpperCase(), 'accent')],
          [seg(`  ${s.help[known]}`)],
          [seg(s.manUsageLabel, 'accent')],
          [seg(`  ${known}${s.help[known].includes('<') ? ' …' : ''}`)],
        ],
      };
    }
    case 'fortune':
      return {
        lines: [[seg(s.fortunes[Math.floor(random() * s.fortunes.length)] ?? '', 'dim')]],
      };
    case 'matrix':
      return { lines: [[seg(s.matrix, 'dim')]], action: { type: 'effect', name: 'matrix' } };
    case 'konami':
      return { lines: [[seg(s.konami, 'dim')]], action: { type: 'effect', name: 'konami' } };
    default: {
      const near = nearest(name);
      return {
        lines: [
          [seg(fill(s.notFound, { cmd }), 'error')],
          ...(near ? [[seg(fill(s.didYouMean, { cmd: near }), 'dim')]] : []),
        ],
      };
    }
  }
}
