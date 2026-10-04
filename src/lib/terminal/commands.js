// Interpréteur du terminal interactif : fonctions pures, sans DOM. Une commande retourne des lignes à afficher et, éventuellement,
// une action que le composant exécute (défilement, thème, langue, ouverture d'un lien…).
//
//   run('skills', { s, d })  ->  { lines: [[{ t: 'Systèmes & Réseaux', kind: 'accent' }], …], action?: { type, … } }
//
// Une ligne est une liste de segments { t, kind?, href?, external? } ; `kind` : 'accent' | 'dim' | 'error'.

export const COMMANDS = ['help', 'whoami', 'about', 'skills', 'experience', 'projects', 'education', 'blog', 'contact', 'links', 'cv', 'ls', 'cat', 'goto', 'theme', 'lang', 'clear'];
export const FILES = ['about.txt', 'stack.txt', 'contact.txt'];
export const SECTIONS = ['home', 'about', 'skills', 'experience', 'projects', 'blog', 'education', 'contact'];

const fill = (text, params = {}) => text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
const t = (text, kind) => ({ t: text, kind });
const link = (text, href, external = false) => ({ t: text, href, external });
const line = (...segments) => segments;
const wrap = (text, width = 56) => {
  const out = [];
  let current = '';
  for (const word of text.split(/\s+/)) {
    if (current && current.length + word.length + 1 > width) {
      out.push(current);
      current = word;
    } else current = current ? `${current} ${word}` : word;
  }
  return current ? [...out, current] : out;
};

/** Complétion par Tab : retourne le texte complété, ou null s'il n'y a rien à compléter. */
export function complete(raw, { sections = SECTIONS } = {}) {
  const m = /^(\S*)(\s+)?(.*)$/.exec(raw.trimStart());
  const [, cmd, space, rest] = m;
  // Candidat unique : on le complète en entier ; plusieurs : seulement jusqu'à leur préfixe commun (comme un shell)
  const pick = (candidates, prefix) => {
    const found = candidates.filter((c) => c.startsWith(prefix));
    if (found.length === 1) return { text: found[0], unique: true };
    let common = found[0] ?? '';
    for (const c of found) while (!c.startsWith(common)) common = common.slice(0, -1);
    return common.length > prefix.length ? { text: common, unique: false } : null;
  };
  if (!space) {
    const done = pick(COMMANDS, cmd);
    return done ? (done.unique ? `${done.text} ` : done.text) : null;
  }
  const candidates = { cat: FILES, goto: sections, theme: ['dark', 'light'], lang: ['fr', 'en'] }[cmd];
  if (!candidates) return null;
  const done = pick(candidates, rest.toLowerCase());
  return done ? `${cmd} ${done.text}` : null;
}

/**
 * @param {string} raw  saisie de l'utilisateur
 * @param {{ s: object, d: object, theme?: string }} ctx  textes (src/data/terminal.js), données (lib/terminal/data.js), thème actuel
 */
export function run(raw, { s, d, theme = 'dark' }) {
  const input = raw.trim();
  if (!input) return { lines: [] };
  const [cmd, ...args] = input.split(/\s+/);
  const name = cmd.toLowerCase();
  const arg = args[0]?.toLowerCase();

  switch (name) {
    case 'help':
    case '?':
      return {
        lines: [
          line(t(s.helpTitle, 'accent')),
          ...COMMANDS.map((c) => line(t(`  ${c.padEnd(11)}`, 'accent'), t(s.help[c]))),
        ],
      };
    case 'whoami':
      return { lines: [line(t(`${d.name.toLowerCase()} · ${d.role.toLowerCase()}`)), line(t(d.location, 'dim'))] };
    case 'about':
      return { lines: wrap(d.about).map((l) => line(t(l))) };
    case 'skills':
      return { lines: d.skills.flatMap((k) => [line(t(`▸ ${k.category}`, 'accent')), ...wrap(k.items, 54).map((l) => line(t(`  ${l}`)))]) };
    case 'experience':
      return {
        lines: d.experiences.flatMap((e) => [line(t(`▸ ${e.role}`, 'accent')), line(t(`  ${e.company} · ${e.location}`)), line(t(`  ${e.date}`, 'dim'))]),
      };
    case 'projects':
      return {
        lines: d.projects.flatMap((p) => [
          line(t('▸ ', 'accent'), p.href ? link(p.title, p.href, true) : t(p.title)),
          line(t(`  ${p.tags.join(' · ')}`, 'dim')),
        ]),
      };
    case 'education':
      return { lines: [...d.education.flatMap((e) => wrap(e).map((l, i) => line(t(i ? `  ${l}` : `▸ ${l}`)))), line(t(d.languagesInfo, 'dim'))] };
    case 'blog':
      return {
        lines: d.posts.length
          ? [...d.posts.map((p) => line(t('▸ ', 'accent'), link(p.title, `${d.paths.blog}${p.slug}/`))), line(t('→ ', 'dim'), link(s.openBlog, d.paths.blog))]
          : [line(t(s.noPosts, 'dim'))],
      };
    case 'contact':
      return {
        lines: [line(t('▸ e-mail  ', 'accent'), link(d.links.email, `mailto:${d.links.email}`)), line(t('▸ form    ', 'accent'), link(s.contactForm, '#contact'))],
        action: { type: 'goto', id: 'contact' },
      };
    case 'links':
      return {
        lines: [
          line(t('▸ GitHub    ', 'accent'), link(d.links.github, d.links.github, true)),
          line(t('▸ LinkedIn  ', 'accent'), link(d.links.linkedin, d.links.linkedin, true)),
          line(t('▸ CV        ', 'accent'), link(d.paths.cv, d.paths.cv, true)),
          line(t('▸ DNS       ', 'accent'), link(s.dnsTool, d.paths.dns)),
        ],
      };
    case 'cv':
      return { lines: [line(t(s.cvOpening, 'dim'))], action: { type: 'open', href: d.paths.cv } };
    case 'ls':
      if (!args.length || ['.', '~', '~/'].includes(args[0])) return { lines: [line(t(s.files))] };
      if (['blog', 'blog/', '~/blog', '~/blog/'].includes(args[0])) return { lines: d.posts.length ? d.posts.map((p) => line(link(p.slug, `${d.paths.blog}${p.slug}/`))) : [line(t(s.noPosts, 'dim'))] };
      return { lines: [line(t(fill(s.catMissing, { file: args[0] }).replace(/^cat/, 'ls'), 'error'))] };
    case 'cat': {
      if (!args.length) return { lines: [line(t(s.catUsage, 'dim'))] };
      const file = arg.replace(/^\.?\/?~?\/?/, '');
      if (file === 'about.txt') return { lines: wrap(d.about).map((l) => line(t(l))) };
      if (file === 'stack.txt') return { lines: [line(t(d.boot[1].out))] };
      if (file === 'contact.txt') return { lines: [line(t(d.links.email)), line(t(d.location, 'dim'))] };
      return { lines: [line(t(fill(s.catMissing, { file: args[0] }), 'error'))] };
    }
    case 'goto': {
      if (!arg) return { lines: [line(t(fill(s.gotoUsage, { sections: SECTIONS.join(', ') }), 'dim'))] };
      const id = SECTIONS.includes(arg) ? arg : SECTIONS.find((k) => s.sections[k] === arg);
      if (!id) return { lines: [line(t(fill(s.gotoMissing, { section: args[0] }), 'error'))] };
      return { lines: [line(t(fill(s.gotoDone, { section: s.sections[id] }), 'dim'))], action: { type: 'goto', id } };
    }
    case 'theme': {
      if (!arg) return { lines: [line(t(fill(s.themeNow, { theme: s.themes[theme] }), 'dim'))] };
      const next = arg === 'toggle' ? (theme === 'dark' ? 'light' : 'dark') : arg;
      if (!['dark', 'light'].includes(next)) return { lines: [line(t(s.themeUsage, 'error'))] };
      return { lines: [line(t(fill(s.themeSet, { theme: s.themes[next] }), 'dim'))], action: { type: 'theme', value: next } };
    }
    case 'lang': {
      if (!arg || !['fr', 'en'].includes(arg)) return { lines: [line(t(s.langUsage, 'dim'))] };
      if (arg === d.lang) return { lines: [line(t(s.langSame, 'dim'))] };
      return { lines: [line(t(fill(s.langSwitching, { lang: s.languages[arg] }), 'dim'))], action: { type: 'navigate', href: d.paths.otherHome } };
    }
    case 'clear':
      return { lines: [], action: { type: 'clear' } };
    case 'pwd':
      return { lines: [line(t('/home/guillaume/portfolio'))] };
    case 'date':
      return { lines: [line(t(new Date().toLocaleString(d.lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'full', timeStyle: 'short' })))] };
    case 'echo':
      return { lines: [line(t(args.join(' ')))] };
    case 'sudo':
      return { lines: [line(t(s.sudo, 'error'))] };
    case 'rm':
      return { lines: [line(t(s.rm, 'error'))] };
    case 'exit':
      return { lines: [line(t(s.exit, 'dim'))] };
    default:
      return { lines: [line(t(fill(s.notFound, { cmd }), 'error'))] };
  }
}

