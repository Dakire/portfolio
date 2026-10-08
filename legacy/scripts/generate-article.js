// Génère un brouillon d'article (français + anglais) dans content/blog, à relire avant publication.
//
//   ANTHROPIC_API_KEY=… node scripts/generate-article.js                 prochain sujet « todo » de content/topics.json
//   node scripts/generate-article.js --topic "Sujet libre"               sujet imposé (texte)
//   node scripts/generate-article.js --id mta-sts-tls-rpt                sujet imposé (identifiant de la liste)
//   node scripts/generate-article.js --fixture tests/fixtures/article-response.json --dry-run   sans API, sans écriture
//   node scripts/generate-article.js --print-prompt                      affiche la consigne envoyée, sans appel
//
// Options : --date AAAA-MM-JJ, --report chemin (rapport Markdown de relecture), --skip-link-check
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { requestArticle } from './lib/article/claude.js';
import { buildReport, buildUserMessage, generateArticle } from './lib/article/generate.js';
import { checkLinks } from './lib/article/links.js';
import { buildSystem } from './lib/article/style.js';
import { markDone, pickTopic, readTopics, saveTopics } from './lib/article/topics.js';

// Erreur lisible plutôt qu'une trace de pile (clé absente, article rejeté, API indisponible…)
for (const event of ['uncaughtException', 'unhandledRejection']) {
  process.on(event, (error) => {
    console.error(`Erreur : ${error?.message ?? error}`);
    process.exit(1);
  });
}

const { values } = parseArgs({
  options: {
    topic: { type: 'string' },
    id: { type: 'string' },
    date: { type: 'string' },
    fixture: { type: 'string' },
    report: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'print-prompt': { type: 'boolean', default: false },
    'skip-link-check': { type: 'boolean', default: false },
  },
});

const date = values.date ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Date invalide : ${date}`);

const topics = readTopics();
const topic = pickTopic(topics, { id: values.id, text: values.topic });

if (values['print-prompt']) {
  console.log(`${buildSystem()}\n\n=== MESSAGE ===\n\n${buildUserMessage({ topic, date })}`);
  process.exit(0);
}

let request;
if (values.fixture) {
  const fixture = JSON.parse(readFileSync(values.fixture, 'utf-8'));
  request = async () => ({ data: fixture, model: 'fixture' });
} else {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY manquante (ou utilisez --fixture pour tester sans API).');
  request = requestArticle;
}

console.log(topic ? `Sujet : ${topic.topic}` : 'Aucun sujet en attente : le modèle en propose un.');
const result = await generateArticle({ topic, date, request, write: !values['dry-run'] });
const links = values['skip-link-check'] || values.fixture ? [] : await checkLinks(result.externalLinks);
const report = buildReport(result, { topic, date, links });

if (values['dry-run']) {
  console.log(`Simulation : ${result.files.map((f) => f.path.pathname.split('/').slice(-3).join('/')).join(' + ')} non écrits.`);
} else {
  if (topic?.id) saveTopics(markDone(topics, topic.id, { slug: result.fr.slug, date }));
  console.log(`Écrits : content/blog/${result.fr.slug}.md et content/blog/en/${result.en.slug}.md`);
}
if (values.report) writeFileSync(values.report, report);
else console.log(`\n${report}`);

// Sorties pour le workflow GitHub Actions
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `slug=${result.fr.slug}\ntitle=${result.fr.title.replace(/\n/g, ' ')}\n`);
