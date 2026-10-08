// Orchestration : sujet -> demande au modèle -> contrôles (avec une nouvelle tentative guidée) -> fichiers -> rapport de relecture.
import { writeFileSync } from 'node:fs';
import { buildSystem } from './style.js';
import { allowedLinks, articlePath, linkCatalog, listArticles } from './site.js';
import { countWords, linksOf, renderArticle, validateArticle, validatePair } from './validate.js';

const MAX_ATTEMPTS = 2;

export function buildUserMessage({ topic, date, problems = [] }) {
  const existing = listArticles('fr').map((a) => `- ${a.slug} : ${a.title}`).join('\n');
  const brief = topic
    ? `Sujet : ${topic.topic}${topic.angle ? `\nAngle : ${topic.angle}` : ''}${topic.tools?.length ? `\nOutils du site à relier si pertinent : ${topic.tools.join(', ')}` : ''}`
    : "Aucun sujet imposé : choisis toi-même un sujet utile à des TPE/PME ou à des administrateurs (messagerie, DNS, Microsoft 365 / Google Workspace, Windows, réseau, sauvegarde, sécurité du quotidien), qui ne recoupe aucun article existant.";
  const retry = problems.length ? `\n\nLa tentative précédente a été rejetée par les contrôles automatiques. Corrige précisément ces points et rédige l'article complet à nouveau :\n${problems.map((p) => `- ${p}`).join('\n')}` : '';
  return `Rédige un nouvel article, en français puis sa version anglaise. Date de publication : ${date}.

${brief}

Articles déjà publiés (ne les répète pas ; relie-les quand c'est utile) :
${existing}

Liens internes autorisés en français :
${linkCatalog('fr')}

Liens internes autorisés en anglais :
${linkCatalog('en')}${retry}`;
}

/**
 * @param {object} options
 * @param {{ id?: string, topic: string, angle?: string, tools?: string[] } | null} options.topic
 * @param {string} options.date AAAA-MM-JJ
 * @param {(args: { system: string, user: string }) => Promise<{ data: object, usage?: object, model?: string }>} options.request
 * @param {boolean} [options.write] écrit les fichiers (faux en simulation)
 */
export async function generateArticle({ topic, date, request, write = true }) {
  const system = buildSystem();
  const taken = { fr: new Set(listArticles('fr').map((a) => a.slug)), en: new Set(listArticles('en').map((a) => a.slug)) };
  const allowed = { fr: allowedLinks('fr'), en: allowedLinks('en') };

  let problems = [];
  let result;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    result = await request({ system, user: buildUserMessage({ topic, date, problems }) });
    const { fr, en } = result.data;
    problems = [
      ...validateArticle(fr, { lang: 'fr', allowed: allowed.fr, taken: taken.fr }),
      ...validateArticle(en, { lang: 'en', allowed: allowed.en, taken: taken.en }),
      ...validatePair(fr, en),
    ];
    if (!problems.length) break;
    console.warn(`Tentative ${attempt} rejetée :\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
  if (problems.length) throw new Error(`Article rejeté après ${MAX_ATTEMPTS} tentatives :\n${problems.map((p) => `- ${p}`).join('\n')}`);

  const { fr, en, claims_to_verify: claims } = result.data;
  const files = [
    { lang: 'fr', path: articlePath('fr', fr.slug), text: renderArticle(fr, { date }, fr.slug) },
    { lang: 'en', path: articlePath('en', en.slug), text: renderArticle(en, { date, translationOf: fr.slug }, en.slug) },
  ];
  if (write) for (const f of files) writeFileSync(f.path, f.text, { flag: 'wx' }); // « wx » : jamais d'écrasement d'un article existant

  const externalLinks = [...new Set([...linksOf(fr.body), ...linksOf(en.body)].map((l) => l.url).filter((u) => u.startsWith('https://')))];
  return { fr, en, claims, files, externalLinks, usage: result.usage, model: result.model, words: { fr: countWords(fr.body), en: countWords(en.body) } };
}

/** Rapport de relecture : sert de description à la pull request. */
export function buildReport({ fr, en, claims, usage, model, words }, { topic, date, links = [] }) {
  const broken = links.filter((l) => !l.ok);
  const linkLines = links.map((l) => `- ${l.ok ? '✅' : '⚠️'} ${l.url}${l.ok ? '' : ` (${l.error ?? `HTTP ${l.status}`})`}`);
  return `## Article généré : ${fr.title}

Brouillon écrit par ${model ?? 'le modèle'} le ${date}. **Il doit être relu par un humain avant fusion** : rien n'est publié tant que cette PR n'est pas fusionnée.

- Sujet : ${topic ? topic.topic : 'proposé par le modèle'}
- Français : \`content/blog/${fr.slug}.md\` (${words.fr} mots)
- Anglais : \`content/blog/en/${en.slug}.md\` (${words.en} mots)
${usage ? `- Consommation : ${usage.input_tokens ?? '?'} jetons en entrée (${usage.cache_read_input_tokens ?? 0} lus du cache), ${usage.output_tokens ?? '?'} en sortie\n` : ''}
### À vérifier avant de fusionner

Le modèle n'a pas accès au web : chaque fait précis est à confirmer à la source.

${claims.map((c) => `- [ ] ${c}`).join('\n')}

### Liens externes${broken.length ? ` (${broken.length} à contrôler)` : ''}

${linkLines.length ? linkLines.join('\n') : 'Aucun.'}

Un ⚠️ peut être un site qui refuse les requêtes automatiques : ouvrez le lien avant de conclure.

### Relecture

- [ ] Le titre, l'introduction et le plan répondent à une vraie question de lecteur
- [ ] Les commandes et extraits de configuration ont été essayés ou sont issus de la documentation
- [ ] La version anglaise dit la même chose que la version française
- [ ] Aucune promesse commerciale, anecdote ou chiffre non sourcé
- [ ] Le build de l'aperçu s'affiche correctement (\`npm run build\`)
`;
}
