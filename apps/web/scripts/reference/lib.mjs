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
export const GLOSSARY_FILE = join(ROOT, 'data', 'reference', 'glossaire.yml');
export const EXAMPLES_DIR = join(ROOT, 'data', 'reference', 'exemples');

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
    // topAfter : les blocs « top » s'affichent après la recherche (quand la recherche est l'essentiel) ; topTitle : leur titre.
    ...(m.topAfter && { topAfter: true }),
    ...(m.searchLabel && { searchLabel: text(m.searchLabel) }),
    ...(m.placeholder && { placeholder: text(m.placeholder) }),
    ...(m.topTitle && { topTitle: text(m.topTitle) }),
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
    // meta.optionalUrl : des entrées sans page de documentation propre (ex. touches BIOS par constructeur).
    if (!url && !m.optionalUrl)
      fail(`${where} : aucune URL de documentation (url, doc + docBase, ou meta.docs)`);
    if (url && !url.startsWith('https://')) fail(`${where} : l'URL doit être en https`);
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
    if (url) out.url = url;
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

const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const tokens = (s) =>
  fold(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Glossaire français -> mots des commandes : [{ fr: string[], en: string[] }]. */
export function readGlossary() {
  if (!existsSync(GLOSSARY_FILE)) return [];
  const list = parse(readFileSync(GLOSSARY_FILE, 'utf-8')) ?? [];
  return list.map((g, i) => {
    if (!Array.isArray(g?.fr) || !Array.isArray(g?.en) || !g.fr.length || !g.en.length)
      throw new Error(`glossaire.yml : groupe n°${i + 1} sans listes « fr » et « en »`);
    return { fr: g.fr.map(String), en: g.en.map((w) => fold(String(w))) };
  });
}

/** Groupes du glossaire qui s'appliquent à un texte : un mot de « en » est un mot du texte (ou, s'il a 5 lettres ou plus, le début d'un mot). */
function glossaryHits(text, glossary) {
  const words = tokens(text);
  const set = new Set(words);
  const kw = new Set();
  for (const g of glossary)
    if (g.en.some((en) => set.has(en) || (en.length >= 5 && words.some((w) => w.startsWith(en)))))
      for (const fr of g.fr) kw.add(fr);
  return kw;
}

/**
 * Mots de recherche français d'une entrée, indexés mais jamais affichés : « kwn » pour ce que dit le nom de la commande
 * (poids fort), « kw » pour le reste (alias, syntaxe, tags). « supprimer utilisateur » place ainsi « gam delete user »
 * devant « gam <UserTypeEntity> delete messages » (dont seul l'alias « gam user … » parle d'utilisateur).
 */
export function frenchKeywords(entry, glossary) {
  const inName = glossaryHits(entry.name, glossary);
  const rest = glossaryHits(
    [...(entry.alias ?? []), entry.syn ?? '', ...(entry.tags ?? [])].join(' '),
    glossary,
  );
  return { kwn: [...inName].join(' '), kw: [...rest].filter((w) => !inName.has(w)).join(' ') };
}

/** Exemples concrets d'une référence générée (data/reference/exemples/<id>.yml) : { idEntrée: { desc?, ex? } }. */
export function readExamples(id) {
  const file = join(EXAMPLES_DIR, `${id}.yml`);
  return existsSync(file) ? (parse(readFileSync(file, 'utf-8')) ?? {}) : {};
}

/** Ajoute les exemples concrets (en tête, sans doublon), la description française et la marque « common » ; idempotent. */
export function applyExamples(refId, entries, examples) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  for (const [id, x] of Object.entries(examples)) {
    const e = byId.get(id);
    if (!e)
      throw new Error(
        `exemples/${refId}.yml : l'entrée « ${id} » n'existe plus dans ${refId}.json`,
      );
    if (x.desc) e.desc = text(x.desc);
    const ex = asList(x.ex).map((v) => v.trim());
    if (ex.length) e.ex = [...ex, ...(e.ex ?? []).filter((v) => !ex.includes(v))];
    e.common = true; // commande courante : légèrement favorisée dans le classement de la recherche
  }
  return entries;
}

/** Entrées publiées : champs de recherche français « kwn » et « kw » recalculés (les références anglaises n'en ont pas). */
const withKeywords = (meta, entries, glossary) =>
  entries.map(({ kw: _kw, kwn: _kwn, ...e }) => {
    if (meta.lang !== 'fr') return e;
    const { kwn, kw } = frenchKeywords(e, glossary);
    return { ...e, ...(kwn && { kwn }), ...(kw && { kw }) };
  });

/** Tous les fichiers de sortie {nom: contenu} ; les références « generated » (GAM) gardent leur JSON existant. */
export function computeOutputs() {
  const outputs = {};
  const metas = [];
  const glossary = readGlossary();
  for (const { file, source } of readSources()) {
    const built = buildReference(file, source);
    const order = source.meta.order ?? 99;
    if (built.meta.generated) {
      const existing = join(OUT_DIR, `${built.meta.id}.json`);
      if (!existsSync(existing)) continue; // pas encore généré : la référence n'est pas publiée
      // Les entrées viennent du dernier « reference:gam » ; les textes de la page (titre, description…) de la source YAML.
      const generated = JSON.parse(readFileSync(existing, 'utf-8'));
      const merged = { ...generated.meta, ...built.meta, count: generated.meta.count };
      const entries = applyExamples(merged.id, generated.entries, readExamples(merged.id));
      outputs[`${built.meta.id}.json`] = serialize({
        meta: merged,
        entries: withKeywords(merged, entries, glossary),
      });
      metas.push({ ...merged, order });
      continue;
    }
    outputs[`${built.meta.id}.json`] = serialize({
      meta: built.meta,
      entries: withKeywords(built.meta, built.entries, glossary),
    });
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
