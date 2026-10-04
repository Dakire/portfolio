// Ressources produites par Vite, lues dans son manifeste (build.manifest) plutôt que déduites du HTML généré.
import { readFile } from 'node:fs/promises';
import { root } from './paths.js';

/**
 * Retourne les balises à insérer dans le <head> des pages : feuille de style, préchargements et script de l'entrée.
 * `manifest` est le contenu de dist/.vite/manifest.json.
 * `islands` : chemins des îlots chargés dynamiquement dont la page a besoin (ex. 'src/islands/dns.jsx') ; ils sont préchargés
 * avec leurs dépendances, ce qui évite un aller-retour réseau après l'exécution du script d'entrée.
 */
export function assetTags(manifest, { islands = [] } = {}) {
  const entry = Object.values(manifest).find((chunk) => chunk.isEntry);
  if (!entry?.file) throw new Error('Entrée introuvable dans le manifeste Vite (build Vite requis avant le pré-rendu)');

  const css = (entry.css ?? []).map((f) => `<link rel="stylesheet" crossorigin href="/${f}">`);
  if (css.length === 0) throw new Error('Aucune feuille de style dans le manifeste Vite');
  const preloads = (entry.imports ?? []).map((key) => `<link rel="modulepreload" crossorigin href="/${manifest[key].file}">`);

  const wanted = new Set();
  const visit = (key) => {
    const chunk = manifest[key];
    if (!chunk || wanted.has(chunk.file)) return;
    wanted.add(chunk.file);
    (chunk.imports ?? []).forEach(visit);
  };
  for (const island of islands) {
    const key = Object.keys(manifest).find((k) => k === island);
    if (!key) throw new Error(`Îlot introuvable dans le manifeste Vite : ${island}`);
    visit(key);
  }
  const alreadyLoaded = new Set([entry.file, ...(entry.imports ?? []).map((key) => manifest[key].file)]);
  const islandPreloads = [...wanted].filter((file) => !alreadyLoaded.has(file)).map((file) => `<link rel="modulepreload" crossorigin href="/${file}">`);

  const script = `<script type="module" crossorigin src="/${entry.file}"></script>`;
  return { css: css.join('\n    '), full: [...css, ...preloads, ...islandPreloads, script].join('\n    ') };
}

export const readManifest = async () => JSON.parse(await readFile(root('dist/.vite/manifest.json'), 'utf-8'));
