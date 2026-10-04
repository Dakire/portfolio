import { describe, expect, it, vi } from 'vitest';
import { TOOLS } from '../../src/data/tools/index.js';
import { buildReport, buildUserMessage, generateArticle } from '../../scripts/lib/article/generate.js';
import { checkLinks } from '../../scripts/lib/article/links.js';
import { allowedLinks, listArticles } from '../../scripts/lib/article/site.js';
import { buildSystem, EXEMPLARS } from '../../scripts/lib/article/style.js';
import { markDone, pickTopic, readTopics } from '../../scripts/lib/article/topics.js';
import { countWords, linksOf, renderArticle, validateArticle, validatePair } from '../../scripts/lib/article/validate.js';
import { parsePost } from '../../scripts/lib/markdown.js';
import { makeArticle, makeResponse } from '../fixtures/article-response.js';

const ctx = (lang, taken = []) => ({ lang, allowed: allowedLinks(lang), taken: new Set(taken) });
const problemsOf = (lang, overrides, taken) => validateArticle(makeArticle(lang, overrides), ctx(lang, taken));

describe('contrôles d\'un article généré', () => {
  it('accepte un article conforme dans les deux langues', () => {
    expect(problemsOf('fr')).toEqual([]);
    expect(problemsOf('en')).toEqual([]);
    expect(validatePair(makeArticle('fr'), makeArticle('en'))).toEqual([]);
  });

  it('refuse un lien interne inventé, un lien non sécurisé et l\'absence de lien interne', () => {
    const base = makeArticle('fr').body;
    expect(problemsOf('fr', { body: base.replace('/outils/dns/', '/outils/inconnu/') }).join('\n')).toMatch(/lien interne inconnu : \/outils\/inconnu\//);
    expect(problemsOf('fr', { body: base.replace('https://learn.microsoft.com/azure/backup/', 'http://learn.microsoft.com/azure/backup/') }).join('\n')).toMatch(/non sécurisé/);
    const noInternal = base.replace(/\[[^\]]+\]\(\/[^)]+\)/g, 'texte');
    expect(problemsOf('fr', { body: noInternal }).join('\n')).toMatch(/aucun lien interne/);
  });

  it('refuse le tiret cadratin, le HTML, un titre de niveau 1 et un bloc de code non fermé', () => {
    const base = makeArticle('fr').body;
    expect(problemsOf('fr', { body: `${base}\nUn texte — avec tiret.` }).join('\n')).toMatch(/tiret cadratin/);
    expect(problemsOf('fr', { body: `${base}\n<script>alert(1)</script>` }).join('\n')).toMatch(/HTML interdit/);
    expect(problemsOf('fr', { body: `# Titre\n${base}` }).join('\n')).toMatch(/niveau 1/);
    expect(problemsOf('fr', { body: `${base}\n\`\`\`bash\nls` }).join('\n')).toMatch(/bloc de code/);
  });

  it('ne tient pas compte du HTML ou du tiret dans les blocs de code', () => {
    const base = makeArticle('fr').body.replace('3 copies, 2 media, 1 off-site', '<div>exemple</div> — ok');
    expect(problemsOf('fr', { body: base }).join('\n')).not.toMatch(/HTML/);
  });

  it('exige une section Sources finale avec des liens, et une longueur raisonnable', () => {
    const base = makeArticle('fr').body;
    expect(problemsOf('fr', { body: base.split('## Sources')[0] }).join('\n')).toMatch(/Sources/);
    expect(problemsOf('fr', { body: base.replace(/^- \[(?!CISA).*$/gm, '') }).join('\n')).toMatch(/liens dans « Sources »/);
    expect(problemsOf('fr', { body: 'Trop court.\n\n## Sources\n\n- [a](https://example.org/a)' }).join('\n')).toMatch(/mots/);
  });

  it('refuse un slug existant, mal formé, ou un titre et une description hors limites', () => {
    const slug = makeArticle('fr').slug;
    expect(problemsOf('fr', {}, [slug]).join('\n')).toMatch(/existe déjà/);
    expect(problemsOf('fr', { slug: 'Slug Invalide' }).join('\n')).toMatch(/slug invalide/);
    expect(problemsOf('fr', { title: 'Court' }).join('\n')).toMatch(/titre de 5 caractères/);
    expect(problemsOf('fr', { description: 'x'.repeat(300) }).join('\n')).toMatch(/description/);
    expect(problemsOf('fr', { title: '"Titre entre guillemets pour un article de blog technique"' }).join('\n')).toMatch(/guillemets/);
  });

  it('refuse les formules d\'assistant qui ont fuité dans le texte', () => {
    expect(problemsOf('fr', { body: `Voici l'article demandé.\n\n${makeArticle('fr').body}` }).join('\n')).toMatch(/formule interdite/);
  });

  it('compare le français et l\'anglais', () => {
    const fr = makeArticle('fr');
    expect(validatePair(fr, { ...makeArticle('en'), slug: fr.slug }).join('\n')).toMatch(/slug anglais/);
    expect(validatePair(fr, { ...makeArticle('en'), body: makeArticle('en').body.replace('```text\n3 copies, 2 media, 1 off-site\n```\n', '') }).join('\n')).toMatch(/blocs de code/);
  });

  it('compte les mots hors code et liste les liens hors code', () => {
    expect(countWords('un deux ```ignoré ignoré``` trois `x y`')).toBe(3);
    expect(linksOf('[a](/x/) et `[b](/y/)`')).toEqual([{ text: 'a', url: '/x/' }]);
  });
});

describe('fichier produit', () => {
  it('est relu par le parseur du build, avec translationOf pour l\'anglais', () => {
    const fr = makeArticle('fr');
    const en = makeArticle('en');
    const frText = renderArticle(fr, { date: '2026-10-05' }, fr.slug);
    const enText = renderArticle(en, { date: '2026-10-05', translationOf: fr.slug }, en.slug);
    expect(parsePost(fr.slug, frText, 'fr', 'Tableau')).toMatchObject({ title: fr.title, date: '2026-10-05' });
    expect(parsePost(en.slug, enText, 'en', 'Table')).toMatchObject({ translationOf: fr.slug, date: '2026-10-05' });
    expect(frText).not.toContain('translationOf');
  });

  it('refuse un front matter que le build rejetterait', () => {
    expect(() => renderArticle({ ...makeArticle('fr'), title: '' }, { date: '2026-10-05' }, 'x')).toThrow(/title/);
    expect(() => renderArticle(makeArticle('fr'), { date: '5 octobre' }, 'x')).toThrow(/AAAA-MM-JJ/);
  });
});

describe('orchestration', () => {
  const topic = { id: 'sauvegarde-3-2-1', topic: 'La règle 3-2-1', angle: 'PME', tools: ['dns'] };

  it('produit les deux fichiers sans écrire quand write est faux', async () => {
    const request = vi.fn(async () => ({ data: makeResponse(), usage: { input_tokens: 10, output_tokens: 20 }, model: 'test' }));
    const result = await generateArticle({ topic, date: '2026-10-05', request, write: false });
    expect(request).toHaveBeenCalledTimes(1);
    expect(result.files).toHaveLength(2);
    expect(result.files[1].text).toContain(`translationOf: ${result.fr.slug}`);
    expect(result.externalLinks).toContain('https://learn.microsoft.com/azure/backup/');
  });

  it('retente une fois en renvoyant les problèmes au modèle', async () => {
    const bad = makeResponse({ fr: { body: `${makeArticle('fr').body}\nTexte — fautif.` } });
    const request = vi.fn().mockResolvedValueOnce({ data: bad }).mockResolvedValueOnce({ data: makeResponse() });
    await generateArticle({ topic, date: '2026-10-05', request, write: false });
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][0].user).toMatch(/tentative précédente a été rejetée[\s\S]*tiret cadratin/);
    expect(request.mock.calls[0][0].user).not.toMatch(/rejetée/);
  });

  it('échoue, sans rien écrire, si la seconde tentative est aussi rejetée', async () => {
    const bad = makeResponse({ en: { description: 'trop court' } });
    const request = vi.fn(async () => ({ data: bad }));
    await expect(generateArticle({ topic, date: '2026-10-05', request, write: false })).rejects.toThrow(/rejeté après 2 tentatives[\s\S]*EN : description/);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('le message liste les articles et liens autorisés, avec le sujet et son angle', () => {
    const user = buildUserMessage({ topic, date: '2026-10-05' });
    expect(user).toContain('Sujet : La règle 3-2-1');
    expect(user).toContain('Angle : PME');
    expect(user).toContain('2026-10-05');
    for (const a of listArticles('fr')) expect(user).toContain(a.slug);
    for (const t of TOOLS) expect(user).toContain(`/en/tools/${t.slug.en}/`);
    expect(buildUserMessage({ topic: null, date: '2026-10-05' })).toMatch(/Aucun sujet imposé/);
  });

  it('la consigne système est identique d\'un appel à l\'autre (préfixe mis en cache) et embarque les exemples', () => {
    expect(buildSystem()).toBe(buildSystem());
    expect(buildSystem()).toContain('Sources');
    for (const { file } of EXEMPLARS) expect(buildSystem()).toContain(file);
  });

  it('le rapport de relecture liste les points à vérifier et les liens à contrôler', () => {
    const result = { ...makeResponse(), claims: makeResponse().claims_to_verify, model: 'test', usage: { input_tokens: 5, output_tokens: 6, cache_read_input_tokens: 3 }, words: { fr: 900, en: 880 } };
    const report = buildReport(result, { topic, date: '2026-10-05', links: [{ url: 'https://a.example/', ok: true, status: 200 }, { url: 'https://b.example/', ok: false, status: 404 }] });
    expect(report).toContain('relu par un humain');
    expect(report).toContain('- [ ] La règle 3-2-1 est décrite par la CISA');
    expect(report).toContain('⚠️ https://b.example/ (HTTP 404)');
    expect(report).toContain('(1 à contrôler)');
  });
});

describe('liste de sujets', () => {
  const topics = readTopics();

  it('chaque sujet a un identifiant unique, un statut valide et des outils qui existent', () => {
    expect(new Set(topics.map((t) => t.id)).size).toBe(topics.length);
    const toolIds = new Set(TOOLS.map((t) => t.id));
    for (const t of topics) {
      expect(['todo', 'done'], t.id).toContain(t.status);
      expect(t.topic.length, t.id).toBeGreaterThan(15);
      for (const tool of t.tools ?? []) expect(toolIds.has(tool), `${t.id} : outil ${tool}`).toBe(true);
    }
  });

  it('prend le premier « todo », ou le sujet demandé, et marque le sujet traité', () => {
    const list = [{ id: 'a', topic: 'A', status: 'done' }, { id: 'b', topic: 'B', status: 'todo' }, { id: 'c', topic: 'C', status: 'todo' }];
    expect(pickTopic(list).id).toBe('b');
    expect(pickTopic(list, { id: 'c' }).id).toBe('c');
    expect(pickTopic(list, { text: 'Libre' })).toMatchObject({ id: null, topic: 'Libre' });
    expect(() => pickTopic(list, { id: 'zzz' })).toThrow(/inconnu/);
    expect(pickTopic([{ id: 'a', topic: 'A', status: 'done' }])).toBeNull();
    expect(markDone(list, 'b', { slug: 's', date: '2026-10-05' }).find((t) => t.id === 'b')).toMatchObject({ status: 'done', slug: 's', date: '2026-10-05' });
  });
});

describe('vérification des liens externes', () => {
  it('suit la méthode GET quand HEAD est refusé, signale les échecs et dédoublonne', async () => {
    const calls = [];
    const fetchImpl = async (url, { method }) => {
      calls.push(`${method} ${url}`);
      if (url.endsWith('/head-refused')) return { status: method === 'HEAD' ? 405 : 200 };
      if (url.endsWith('/missing')) return { status: 404 };
      if (url.endsWith('/down')) throw Object.assign(new Error('fetch failed'), { cause: { code: 'ENOTFOUND' } });
      return { status: 200 };
    };
    const results = await checkLinks(['https://a.example/ok', 'https://a.example/ok', 'https://a.example/head-refused', 'https://a.example/missing', 'https://a.example/down'], { fetchImpl });
    expect(results.map((r) => [r.url.split('/').pop(), r.ok])).toEqual([['ok', true], ['head-refused', true], ['missing', false], ['down', false]]);
    expect(results.at(-1).error).toBe('ENOTFOUND');
    expect(calls.filter((c) => c.endsWith('/ok'))).toHaveLength(1);
    expect(calls).toContain('GET https://a.example/head-refused');
  });
});
