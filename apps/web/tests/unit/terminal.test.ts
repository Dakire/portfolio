import { describe, expect, it } from 'vitest';
import {
  COMMANDS,
  SECTIONS,
  complete,
  run,
  type Context,
  type Result,
  type TerminalData,
} from '../../src/terminal/commands';
import { TERMINAL } from '../../src/terminal/text';

const data = (lang: 'fr' | 'en'): TerminalData => ({
  lang,
  name: 'Guillaume Richard',
  role: 'Technicien Informatique',
  location: 'Laval, France',
  about: 'Passionné par l’informatique depuis toujours.',
  stack: 'Microsoft 365 · Google Workspace · DNS',
  skills: [{ category: 'Réseau & Systèmes', items: 'Windows Server, Linux' }],
  experiences: [{ role: 'Technicien', company: 'TIXIA', date: 'Depuis 2023' }],
  projects: [
    { title: 'Outil de Conversion Email', tags: ['C#'] },
    { title: 'Portfolio', tags: ['Astro'], href: 'https://github.com/Dakire/portfolio' },
  ],
  tools: [
    { id: 'dns', name: 'DNS Lookup', href: lang === 'fr' ? '/outils/dns/' : '/en/tools/dns/' },
    { id: 'json', name: 'Formateur JSON', href: '/outils/formateur-json/' },
  ],
  posts: [
    {
      title: 'SPF, DKIM et DMARC',
      slug: 'spf-dkim-dmarc-expliques',
      href: '/blog/spf-dkim-dmarc-expliques/',
    },
  ],
  links: {
    email: 'contact@grichard.eu',
    github: 'https://github.com/Dakire',
    linkedin: 'https://www.linkedin.com/in/guillaume-richard-in',
  },
  paths: {
    blog: lang === 'fr' ? '/blog/' : '/en/blog/',
    tools: lang === 'fr' ? '/outils/' : '/en/tools/',
    contact: lang === 'fr' ? '/contact/' : '/en/contact/',
    cv: lang === 'fr' ? '/CV_Guillaume_Richard_FR.pdf' : '/Resume_Guillaume_Richard_EN.pdf',
    otherHome: lang === 'fr' ? '/en/' : '/',
  },
});
const ctx = (lang: 'fr' | 'en' = 'fr', over: Partial<Context> = {}): Context => ({
  s: TERMINAL[lang],
  d: data(lang),
  theme: 'dark',
  ...over,
});
const text = (r: Result) => r.lines.map((l) => l.map((seg) => seg.t).join('')).join('\n');
const hrefs = (r: Result) => r.lines.flat().flatMap((seg) => (seg.href ? [seg.href] : []));

describe('textes du terminal', () => {
  const keys = (o: object, p = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) =>
      v && typeof v === 'object' && !Array.isArray(v)
        ? keys(v as object, `${p}${k}.`)
        : [`${p}${k}`],
    );

  it('FR et EN ont les mêmes clés', () => {
    expect(keys(TERMINAL.en).sort()).toEqual(keys(TERMINAL.fr).sort());
  });

  it('chaque commande et chaque section ont leur texte dans les deux langues', () => {
    for (const lang of ['fr', 'en'] as const) {
      for (const c of COMMANDS) expect(TERMINAL[lang].help[c], `${lang} ${c}`).toBeTruthy();
      for (const id of SECTIONS) expect(TERMINAL[lang].sections[id], `${lang} ${id}`).toBeTruthy();
    }
  });

  it('les suggestions sont des commandes existantes', () => {
    for (const lang of ['fr', 'en'] as const)
      for (const c of TERMINAL[lang].suggestions) expect(COMMANDS).toContain(c);
  });
});

describe('commandes', () => {
  it('help liste toutes les commandes (et pas les easter eggs)', () => {
    const out = text(run('help', ctx()));
    for (const c of COMMANDS) expect(out).toContain(c);
    expect(out).not.toContain('sudo');
  });

  it('whoami, about, skills, experience, projects', () => {
    expect(text(run('whoami', ctx()))).toContain('guillaume richard');
    expect(text(run('about', ctx()))).toContain('Passionné');
    expect(text(run('skills', ctx()))).toContain('Réseau & Systèmes');
    expect(text(run('experience', ctx()))).toContain('TIXIA');
    const projects = run('projects', ctx());
    expect(text(projects)).toContain('Outil de Conversion Email');
    expect(projects.lines.flat().find((s) => s.href)).toMatchObject({
      href: 'https://github.com/Dakire/portfolio',
      external: true,
    });
  });

  it('tools liste les outils en liens ; open ouvre un outil connu', () => {
    expect(hrefs(run('tools', ctx()))).toEqual(['/outils/dns/', '/outils/formateur-json/']);
    expect(run('open dns', ctx()).action).toEqual({ type: 'navigate', href: '/outils/dns/' });
    expect(run('open DNS', ctx('en')).action).toEqual({ type: 'navigate', href: '/en/tools/dns/' });
    expect(run('open nope', ctx()).lines[0]![0]!.kind).toBe('error');
    expect(text(run('open', ctx()))).toContain('usage');
  });

  it('blog et ls ~/blog : liens vers les articles', () => {
    expect(hrefs(run('blog', ctx()))).toEqual(['/blog/spf-dkim-dmarc-expliques/', '/blog/']);
    expect(text(run('ls ~/blog', ctx()))).toContain('spf-dkim-dmarc-expliques');
    expect(run('ls nope', ctx()).lines[0]![0]!.kind).toBe('error');
  });

  it("contact donne l'e-mail, le formulaire et défile vers la section", () => {
    const r = run('contact', ctx());
    expect(text(r)).toContain('contact@grichard.eu');
    expect(hrefs(r)).toContain('/contact/');
    expect(r.action).toEqual({ type: 'goto', id: 'contact' });
  });

  it('cv ouvre le PDF de la langue ; links, ls, cat', () => {
    expect(run('cv', ctx()).action).toEqual({ type: 'open', href: '/CV_Guillaume_Richard_FR.pdf' });
    expect(run('cv', ctx('en')).action).toEqual({
      type: 'open',
      href: '/Resume_Guillaume_Richard_EN.pdf',
    });
    expect(hrefs(run('links', ctx()))).toContain('/outils/');
    expect(text(run('ls', ctx()))).toContain('stack.txt');
    expect(text(run('cat stack.txt', ctx()))).toContain('Microsoft 365');
    expect(text(run('cat ./about.txt', ctx()))).toContain('Passionné');
    expect(text(run('cat ~/contact.txt', ctx()))).toContain('contact@grichard.eu');
    expect(run('cat nope.txt', ctx()).lines[0]![0]!.kind).toBe('error');
    expect(text(run('cat', ctx()))).toContain('usage');
  });

  it("goto (et cd) accepte l'identifiant ou le nom affiché de la section", () => {
    expect(run('goto skills', ctx()).action).toEqual({ type: 'goto', id: 'skills' });
    expect(run('goto compétences', ctx()).action).toEqual({ type: 'goto', id: 'skills' });
    expect(run('cd ~/projects/', ctx()).action).toEqual({ type: 'goto', id: 'projects' });
    expect(run('goto nulle-part', ctx()).lines[0]![0]!.kind).toBe('error');
    expect(text(run('goto', ctx()))).toContain('usage');
  });

  it('theme, lang, clear', () => {
    expect(run('theme light', ctx()).action).toEqual({ type: 'theme', value: 'light' });
    expect(run('theme auto', ctx()).action).toEqual({ type: 'theme', value: 'auto' });
    expect(run('theme toggle', ctx('fr', { theme: 'light' })).action).toEqual({
      type: 'theme',
      value: 'dark',
    });
    expect(text(run('theme', ctx()))).toContain('sombre');
    expect(run('theme rose', ctx()).lines[0]![0]!.kind).toBe('error');
    expect(run('lang en', ctx()).action).toEqual({ type: 'navigate', href: '/en/' });
    expect(run('lang fr', ctx()).action).toBeUndefined();
    expect(run('lang fr', ctx('en')).action).toEqual({ type: 'navigate', href: '/' });
    expect(run('clear', ctx()).action).toEqual({ type: 'clear' });
  });

  it('neofetch résume le profil', () => {
    const out = text(run('neofetch', ctx()));
    expect(out).toContain('Guillaume Richard');
    expect(out).toContain('Microsoft 365');
  });

  it('saisie vide, commande inconnue et easter eggs', () => {
    expect(run('   ', ctx()).lines).toEqual([]);
    expect(text(run('bidule', ctx()))).toContain('commande introuvable : bidule');
    expect(text(run('bidule', ctx('en')))).toContain('command not found: bidule');
    expect(text(run('sudo rm -rf /', ctx()))).toContain('incident');
    expect(text(run('echo bonjour  le monde', ctx()))).toBe('bonjour le monde');
    expect(text(run('pwd', ctx()))).toBe('/home/guillaume/portfolio');
  });

  it('ne produit jamais de HTML : les lignes ne contiennent que du texte', () => {
    const r = run('echo <img src=x onerror=alert(1)>', ctx());
    expect(r.lines[0]![0]).toEqual({ t: '<img src=x onerror=alert(1)>' });
  });
});

describe('complétion', () => {
  it.each([
    ['he', 'help '],
    ['sk', 'skills '],
    ['pro', 'projects '],
    ['c', null], // cat, cd, clear, contact, cv : ambigu sans préfixe commun plus long
    ['neo', 'neofetch '],
    ['goto sk', 'goto skills'],
    ['goto t', 'goto tools'],
    ['theme d', 'theme dark'],
    ['theme a', 'theme auto'],
    ['lang e', 'lang en'],
    ['cat s', 'cat stack.txt'],
    ['zzz', null],
    ['help ', null],
  ])('%s -> %s', (input, expected) => expect(complete(input)).toBe(expected));

  it('complète le nom des outils pour open', () => {
    expect(complete('open d', data('fr'))).toBe('open dns');
    expect(complete('open x', data('fr'))).toBeNull();
  });

  it("complète jusqu'au préfixe commun quand plusieurs commandes correspondent", () => {
    expect(complete('ex')).toBeNull(); // experience, exit : rien de plus que « ex » en commun
    expect(complete('cl')).toBe('clear ');
    expect(complete('expe')).toBe('experience ');
  });
});
