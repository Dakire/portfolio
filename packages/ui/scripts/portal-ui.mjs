// Design system de l'espace client (apps/portal) : mêmes polices, jetons, base, composants et curseur que grichard.eu.
// Le portail est livré sans Node (FTP, PHP seul) : ce script, lancé au développement, écrit dans apps/portal/public/ui/
//   - ui.css : fonts.css (chemins des polices réécrits) + tokens.css + base.css + components.css + cursor.css, dans cet ordre ;
//   - fonts/*.woff2 : les fichiers de police référencés.
// La sortie est commitée ; packages/ui/tests/portal-ui.test.ts échoue si elle n'est plus à jour : relancer
//   pnpm --filter @grichard/ui portal-ui
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ui = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(ui, 'src');
export const OUT = resolve(ui, '../../apps/portal/public/ui');
export const SHEETS = ['fonts.css', 'tokens.css', 'base.css', 'components.css', 'cursor.css'];

const HEADER =
  '/* Fichier généré par packages/ui/scripts/portal-ui.mjs à partir de packages/ui/src : ne pas modifier à la main. */\n';

/** Feuille unique et liste des polices à copier ({ name, from }). */
export async function buildPortalUi() {
  const fonts = [];
  const parts = [];
  for (const sheet of SHEETS) {
    let css = await readFile(join(src, sheet), 'utf-8');
    if (sheet === 'fonts.css')
      css = css.replace(/url\((\.\.\/node_modules\/[^)]+\.woff2)\)/g, (_m, path) => {
        const name = basename(path);
        if (!fonts.some((f) => f.name === name)) fonts.push({ name, from: resolve(src, path) });
        return `url(fonts/${name})`;
      });
    parts.push(`/* ---- ${sheet} ---- */\n${css.trim()}\n`);
  }
  return { css: HEADER + parts.join('\n'), fonts };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { css, fonts } = await buildPortalUi();
  await rm(join(OUT, 'fonts'), { recursive: true, force: true });
  await mkdir(join(OUT, 'fonts'), { recursive: true });
  await writeFile(join(OUT, 'ui.css'), css);
  for (const { name, from } of fonts) await copyFile(from, join(OUT, 'fonts', name));
  console.log(`[portal-ui] ui.css (${css.length} octets) et ${fonts.length} police(s) dans ${OUT}`);
}
