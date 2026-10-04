import { describe, expect, it } from 'vitest';
import { PORTFOLIO_DATA } from '../../src/data/content.js';
import { TERMINAL } from '../../src/data/terminal.js';
import { COMMANDS, complete, run, SECTIONS } from '../../src/lib/terminal/commands.js';
import { terminalData } from '../../src/lib/terminal/data.js';

const posts = [{ slug: 'spf-dkim-dmarc-expliques', title: 'SPF, DKIM et DMARC' }, { slug: 'autre', title: 'Autre' }];
const ctx = (lang = 'fr', over = {}) => ({ s: TERMINAL[lang], d: terminalData(lang, PORTFOLIO_DATA[lang], posts), theme: 'dark', ...over });
const text = (result) => result.lines.map((l) => l.map((seg) => seg.t).join('')).join('\n');

describe('textes du terminal', () => {
  const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${p}${k}.`) : [`${p}${k}`]));

  it('FR et EN ont les mêmes clés', () => {
    expect(keys(TERMINAL.en).sort()).toEqual(keys(TERMINAL.fr).sort());
  });

  it('chaque commande listée a sa description dans les deux langues', () => {
    for (const lang of ['fr', 'en']) for (const c of COMMANDS) expect(TERMINAL[lang].help[c], `${lang} ${c}`).toBeTruthy();
  });

  it('chaque section a un nom dans les deux langues', () => {
    for (const lang of ['fr', 'en']) for (const id of SECTIONS) expect(TERMINAL[lang].sections[id], `${lang} ${id}`).toBeTruthy();
  });
});

describe('commandes', () => {
  it('help liste toutes les commandes', () => {
    const out = text(run('help', ctx()));
    for (const c of COMMANDS) expect(out).toContain(c);
  });

  it('whoami, about, skills, experience, projects, education', () => {
    expect(text(run('whoami', ctx()))).toContain('guillaume richard');
    expect(text(run('about', ctx()))).toContain('Passionné');
    expect(text(run('skills', ctx()))).toContain('Systèmes & Réseaux');
    expect(text(run('experience', ctx()))).toContain('TIXIA');
    expect(text(run('projects', ctx()))).toContain('Outil de Conversion Email');
    expect(text(run('education', ctx()))).toContain('Licence Informatique');
  });

  it('blog liste les articles sous forme de liens vers leur page', () => {
    const r = run('blog', ctx());
    const links = r.lines.flat().filter((s) => s.href);
    expect(links.map((l) => l.href)).toEqual(['/blog/spf-dkim-dmarc-expliques/', '/blog/autre/', '/blog/']);
    expect(run('blog', ctx('en')).lines.flat().filter((s) => s.href)[0].href).toBe('/en/blog/spf-dkim-dmarc-expliques/');
  });

  it('contact donne l\'e-mail et défile vers le formulaire', () => {
    const r = run('contact', ctx());
    expect(text(r)).toContain('contact@grichard.eu');
    expect(r.action).toEqual({ type: 'goto', id: 'contact' });
  });

  it('links, cv, ls, cat', () => {
    expect(run('links', ctx()).lines.flat().filter((s) => s.href).map((s) => s.href)).toContain('/outils/dns/');
    expect(run('cv', ctx()).action).toEqual({ type: 'open', href: '/CV_Guillaume_Richard_FR.pdf' });
    expect(run('cv', ctx('en')).action.href).toBe('/Resume_Guillaume_Richard_EN.pdf');
    expect(text(run('ls', ctx()))).toContain('stack.txt');
    expect(text(run('ls ~/blog', ctx()))).toContain('spf-dkim-dmarc-expliques');
    expect(text(run('cat stack.txt', ctx()))).toContain('Microsoft 365');
    expect(text(run('cat ./about.txt', ctx()))).toContain('Passionné');
    expect(run('cat nope.txt', ctx()).lines[0][0].kind).toBe('error');
    expect(text(run('cat', ctx()))).toContain('usage');
  });

  it('goto accepte l\'identifiant ou le nom affiché de la section', () => {
    expect(run('goto skills', ctx()).action).toEqual({ type: 'goto', id: 'skills' });
    expect(run('goto compétences', ctx()).action).toEqual({ type: 'goto', id: 'skills' });
    expect(run('goto experience', ctx('en')).action).toEqual({ type: 'goto', id: 'experience' });
    expect(run('goto nulle-part', ctx()).lines[0][0].kind).toBe('error');
    expect(text(run('goto', ctx()))).toContain('usage');
  });

  it('theme, lang, clear', () => {
    expect(run('theme light', ctx()).action).toEqual({ type: 'theme', value: 'light' });
    expect(run('theme toggle', ctx()).action).toEqual({ type: 'theme', value: 'light' });
    expect(run('theme toggle', ctx('fr', { theme: 'light' })).action).toEqual({ type: 'theme', value: 'dark' });
    expect(text(run('theme', ctx()))).toContain('sombre');
    expect(run('theme rose', ctx()).lines[0][0].kind).toBe('error');
    expect(run('lang en', ctx()).action).toEqual({ type: 'navigate', href: '/en/' });
    expect(run('lang fr', ctx()).action).toBeUndefined();
    expect(run('lang fr', ctx('en')).action).toEqual({ type: 'navigate', href: '/' });
    expect(run('clear', ctx()).action).toEqual({ type: 'clear' });
  });

  it('traite une saisie vide, une commande inconnue et les œufs de Pâques', () => {
    expect(run('   ', ctx()).lines).toEqual([]);
    expect(text(run('bidule', ctx()))).toContain('commande introuvable : bidule');
    expect(text(run('bidule', ctx('en')))).toContain('command not found: bidule');
    expect(text(run('sudo rm -rf /', ctx()))).toContain('incident');
    expect(text(run('echo bonjour  le monde', ctx()))).toBe('bonjour le monde');
    expect(text(run('pwd', ctx()))).toBe('/home/guillaume/portfolio');
  });

  it('ne produit jamais de HTML : les lignes ne contiennent que du texte', () => {
    const r = run('echo <img src=x onerror=alert(1)>', ctx());
    expect(r.lines[0][0]).toEqual({ t: '<img src=x onerror=alert(1)>', kind: undefined });
  });
});

describe('complétion', () => {
  it.each([
    ['he', 'help '],
    ['sk', 'skills '],
    ['pro', 'projects '],
    ['c', null], // cat, contact, clear, cv… : ambigu sans préfixe commun plus long
    ['goto sk', 'goto skills'],
    ['goto e', null], // education / experience : ambigu
    ['goto ex', 'goto experience'],
    ['theme d', 'theme dark'],
    ['lang e', 'lang en'],
    ['cat s', 'cat stack.txt'],
    ['zzz', null],
    ['help ', null],
  ])('%s -> %s', (input, expected) => expect(complete(input)).toBe(expected));

  it('complète jusqu\'au préfixe commun quand plusieurs commandes correspondent', () => {
    expect(complete('ed')).toBe('education ');
    expect(complete('exp')).toBe('experience ');
  });
});
