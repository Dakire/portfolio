// Ressources produites par Vite, lues dans son manifeste (build.manifest) plutôt que déduites du HTML généré.
import { readFile } from 'node:fs/promises';
import { root } from './paths.js';

/**
 * Retourne les balises à insérer dans le <head> des pages : feuille de style, préchargements et script de l'entrée.
 * `manifest` est le contenu de dist/.vite/manifest.json.
 */
export function assetTags(manifest) {
  const entry = Object.values(manifest).find((chunk) => chunk.isEntry);
  if (!entry?.file) throw new Error('Entrée introuvable dans le manifeste Vite (build Vite requis avant le pré-rendu)');

  const css = (entry.css ?? []).map((f) => `<link rel="stylesheet" crossorigin href="/${f}">`);
  if (css.length === 0) throw new Error('Aucune feuille de style dans le manifeste Vite');
  const preloads = (entry.imports ?? []).map((key) => `<link rel="modulepreload" crossorigin href="/${manifest[key].file}">`);
  const script = `<script type="module" crossorigin src="/${entry.file}"></script>`;

  return { css: css.join('\n    '), full: [...css, ...preloads, script].join('\n    ') };
}

export const readManifest = async () => JSON.parse(await readFile(root('dist/.vite/manifest.json'), 'utf-8'));
