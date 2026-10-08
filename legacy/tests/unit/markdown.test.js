import { describe, expect, it } from 'vitest';
import { enhance, esc, parseFrontMatter, parsePost, slugify } from '../../scripts/lib/markdown.js';

const article = (front, body = 'Texte.') => `---\n${front}\n---\n${body}`;
const VALID = 'title: Un titre\ndescription: Une description\ndate: 2026-01-15';

describe('parseFrontMatter', () => {
  it('lit les champs, y compris un titre contenant « : »', () => {
    const { meta, body } = parseFrontMatter(article('title: SPF, DKIM and DMARC: a Guide\ndescription: d\ndate: 2026-01-15', 'Corps'), 'a');
    expect(meta.title).toBe('SPF, DKIM and DMARC: a Guide');
    expect(body).toBe('Corps');
  });

  it('retire les guillemets doubles englobants', () => {
    expect(parseFrontMatter(article('title: "Cité"\ndescription: d\ndate: 2026-01-15'), 'a').meta.title).toBe('Cité');
  });

  it('accepte les fins de ligne Windows', () => {
    expect(parseFrontMatter(article(VALID).replace(/\n/g, '\r\n'), 'a').meta.date).toBe('2026-01-15');
  });

  it('refuse un article sans front matter', () => {
    expect(() => parseFrontMatter('Juste du texte', 'a')).toThrow(/Front matter manquant/);
  });

  it('refuse une ligne sans « : » au lieu de produire une clé absurde', () => {
    expect(() => parseFrontMatter(article(`${VALID}\nnimportequoi`), 'a')).toThrow(/ligne 4/);
  });

  it('refuse une clé inconnue (faute de frappe)', () => {
    expect(() => parseFrontMatter(article(`${VALID}\ntranslationof: x`), 'a')).toThrow(/inconnue/);
  });

  it('refuse une clé en double', () => {
    expect(() => parseFrontMatter(article(`${VALID}\ntitle: Autre`), 'a')).toThrow(/double/);
  });

  it('exige title, description et date', () => {
    expect(() => parseFrontMatter(article('title: t\ndescription: d'), 'a')).toThrow(/"date" manquant/);
  });

  it('exige des dates AAAA-MM-JJ', () => {
    expect(() => parseFrontMatter(article('title: t\ndescription: d\ndate: 15/01/2026'), 'a')).toThrow(/AAAA-MM-JJ/);
    expect(() => parseFrontMatter(article(`${VALID}\nupdated: demain`), 'a')).toThrow(/AAAA-MM-JJ/);
  });
});

describe('slugify', () => {
  it.each([
    ['Qu’est-ce que SPF ?', 'qu-est-ce-que-spf'],
    ['Délivrabilité & DNS', 'delivrabilite-dns'],
    ['  --  ', ''],
  ])('%s -> %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe('enhance', () => {
  it('ajoute des ancres uniques aux h2 et construit le sommaire', () => {
    const { html, toc } = enhance('<h2>Étape</h2><p>x</p><h2>Étape</h2>', 'Tableau');
    expect(toc.map((s) => s.id)).toEqual(['etape', 'etape-2']);
    expect(html).toContain('<h2 id="etape">');
    expect(html).toContain('<h2 id="etape-2">');
  });

  it('rend les tableaux défilables au clavier, avec un libellé échappé', () => {
    const { html } = enhance('<table><tr><td>1</td></tr></table>', 'Tableau "large"');
    expect(html).toContain('role="region" aria-label="Tableau &quot;large&quot;" tabindex="0"><table>');
    expect(html.endsWith('</table></div>')).toBe(true);
  });

  it('rend les blocs de code défilables au clavier', () => {
    const { html } = enhance('<pre><code class="language-sh">ls</code></pre>', 'Tableau');
    expect(html).toBe('<pre tabindex="0"><code class="language-sh">ls</code></pre>');
  });
});

describe('parsePost', () => {
  it('produit le HTML, le sommaire et un temps de lecture d\'au moins une minute', () => {
    const post = parsePost('mon-article', article(VALID, '## Titre\n\nUn **mot**.'), 'fr', 'Tableau');
    expect(post).toMatchObject({ slug: 'mon-article', lang: 'fr', title: 'Un titre', readingTime: 1 });
    expect(post.html).toContain('<strong>mot</strong>');
    expect(post.toc).toEqual([{ id: 'titre', text: 'Titre' }]);
  });
});

describe('esc', () => {
  it('échappe les caractères HTML des attributs', () => {
    expect(esc('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});
