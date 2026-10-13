// Génération des index de la section « Référence » : lit data/reference/src/*.yml, valide, écrit public/data/reference/*.json.
// Tourne uniquement en local (jamais en production) ; les JSON générés sont commités. Voir « pnpm reference:build ».
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..', '..');
export const SRC_DIR = join(ROOT, 'data', 'reference', 'src');
export const OUT_DIR = join(ROOT, 'public', 'data', 'reference');
export const DATA_URL = '/data/reference';

const ENTRY_KEYS = new Set([
  'name',
  'cat',
  'syn',
  'desc',
  'alias',
  'ex',
  'tags',
  'doc',
  'url',
  'module',
  'perms',
  'pitfall',
  'equiv',
  'risk',
]);
const RISKS = new Set(['read', 'modify', 'admin']);

export const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const asList = (v) => (v == null ? [] : Array.isArray(v) ? v.map(String) : [String(v)]);
const text = (v) =>
  v == null
    ? undefined
    : String(v)
        .trim()
        .replace(/\s*\n+\s*/g, ' ') || undefined;

/** Valide et normalise une source ; lève une erreur lisible (fichier, entrée, champ). */
export function buildReference(file, source) {
  const fail = (msg) => {
    throw new Error(`${file} : ${msg}`);
  };
  const m = source?.meta;
  if (!m) fail('bloc « meta » manquant');
  for (const k of ['id', 'title', 'h1', 'description', 'intro'])
    if (!text(m[k])) fail(`meta.${k} manquant`);
  if (!/^[a-z0-9-]+$/.test(m.id)) fail('meta.id : minuscules, chiffres et tirets');
  const description = text(m.description);
  if (description.length < 60 || description.length > 300)
    fail('meta.description : 60 à 300 caractères');
  const cats = (m.cats ?? []).map((c) => ({ id: String(c.id), label: String(c.label) }));
  if (!cats.length) fail('meta.cats vide');
  const catIds = new Set(cats.map((c) => c.id));
  if (catIds.size !== cats.length) fail('meta.cats : identifiants en double');
  const fields = (m.fields ?? []).map((f) => ({ key: String(f.key), label: String(f.label) }));
  for (const f of fields) if (!ENTRY_KEYS.has(f.key)) fail(`meta.fields : « ${f.key} » inconnu`);

  const meta = {
    id: m.id,
    lang: m.lang ?? 'fr',
    title: text(m.title),
    h1: text(m.h1),
    description,
    intro: text(m.intro),
    card: text(m.card) ?? description,
    cats,
    fields,
    ...(m.docs && { docs: { label: String(m.docs.label), url: String(m.docs.url) } }),
    ...(m.source && { source: m.source }),
    ...(m.top && { top: m.top }),
    ...(m.notice && { notice: text(m.notice) }),
    ...(m.generated && { generated: String(m.generated) }),
  };

  const seen = new Map();
  const entries = (source.entries ?? []).map((e, i) => {
    const where = `entrée n°${i + 1} (${e?.name ?? '?'})`;
    if (!text(e.name)) fail(`${where} : « name » manquant`);
    for (const k of Object.keys(e))
      if (!ENTRY_KEYS.has(k)) fail(`${where} : champ « ${k} » inconnu`);
    if (!catIds.has(e.cat)) fail(`${where} : catégorie « ${e.cat} » absente de meta.cats`);
    if (!text(e.syn) && !text(e.desc)) fail(`${where} : ni « syn » ni « desc »`);
    if (e.risk && !RISKS.has(e.risk)) fail(`${where} : risk doit valoir read, modify ou admin`);
    // doc : suffixe de meta.docBase, ou « clé/suffixe » avec meta.docBases (ex. cmd/sfc) ; url : adresse complète.
    const [bk, ...rest] = String(e.doc ?? '').split('/');
    const docUrl = e.doc
      ? m.docBases?.[bk] !== undefined
        ? m.docBases[bk] + rest.join('/')
        : m.docBase + e.doc
      : undefined;
    const url = e.url ? String(e.url) : (docUrl ?? meta.docs?.url);
    if (!url) fail(`${where} : aucune URL de documentation (url, doc + docBase, ou meta.docs)`);
    if (!url.startsWith('https://')) fail(`${where} : l'URL doit être en https`);
    let id = slug(e.name);
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    if (n > 1) id = `${id}-${n}`;
    const out = { id, name: text(e.name), cat: e.cat };
    if (text(e.syn)) out.syn = text(e.syn);
    if (text(e.desc)) out.desc = text(e.desc);
    if (asList(e.alias).length) out.alias = asList(e.alias);
    if (asList(e.ex).length) out.ex = asList(e.ex).map((x) => x.replace(/\s+$/, ''));
    if (asList(e.tags).length) out.tags = asList(e.tags);
    for (const f of ['module', 'perms', 'pitfall', 'equiv', 'risk'])
      if (text(e[f])) out[f] = text(e[f]);
    out.url = url;
    return out;
  });
  if (!entries.length && !meta.generated) fail('aucune entrée');
  meta.count = entries.length;
  return { meta, entries };
}

export function readSources() {
  return readdirSync(SRC_DIR)
    .filter((f) => f.endsWith('.yml'))
    .sort()
    .map((f) => {
      try {
        return { file: f, source: parse(readFileSync(join(SRC_DIR, f), 'utf-8')) };
      } catch (error) {
        throw new Error(
          `${f} : YAML invalide (mettez entre guillemets toute valeur qui contient « : » ou « # »). ${error.message}`,
        );
      }
    });
}

export const serialize = (data) => JSON.stringify(data) + '\n';

/** Tous les fichiers de sortie {nom: contenu} ; les références « generated » (GAM) gardent leur JSON existant. */
export function computeOutputs() {
  const outputs = {};
  const metas = [];
  for (const { file, source } of readSources()) {
    const built = buildReference(file, source);
    const order = source.meta.order ?? 99;
    if (built.meta.generated) {
      const existing = join(OUT_DIR, `${built.meta.id}.json`);
      if (!existsSync(existing)) continue; // pas encore généré : la référence n'est pas publiée
      metas.push({ ...JSON.parse(readFileSync(existing, 'utf-8')).meta, order });
      continue;
    }
    outputs[`${built.meta.id}.json`] = serialize(built);
    metas.push({ ...built.meta, order });
  }
  metas.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  // index.json : métadonnées seules (cartes, pages, recherche globale) ; sans les entrées, il reste léger.
  outputs['index.json'] = serialize({
    refs: metas.map(({ order: _order, ...meta }) => ({
      ...meta,
      file: `${DATA_URL}/${meta.id}.json`,
    })),
  });
  return outputs;
}

/** MiniSearch, versionné dans le dépôt (aucun CDN) : copie de node_modules vers public/js/libs/. */
export function vendorMiniSearch() {
  const pkgDir = join(ROOT, 'node_modules', 'minisearch');
  const { version } = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8'));
  const body = readFileSync(join(pkgDir, 'dist', 'umd', 'index.js'), 'utf-8');
  const banner = `/*! MiniSearch ${version} (MIT, (c) Luca Ongaro) : https://github.com/lucaong/minisearch ; copie locale régénérée par « pnpm reference:build ». */\n`;
  return { name: 'minisearch.js', content: banner + body };
}

export function writeOutputs(outputs) {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, content] of Object.entries(outputs))
    writeFileSync(join(OUT_DIR, name), content);
  const vendor = vendorMiniSearch();
  mkdirSync(join(ROOT, 'public', 'js', 'libs'), { recursive: true });
  writeFileSync(join(ROOT, 'public', 'js', 'libs', vendor.name), vendor.content);
}
