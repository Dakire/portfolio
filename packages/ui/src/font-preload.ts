// Polices à précharger (<link rel="preload">) : titres et texte courant, pour qu'ils soient prêts au premier affichage.
// Mêmes fichiers que fonts.css (même chemin relatif) : le build n'en produit qu'une copie, le préchargement sert bien la feuille de style.
import display from '../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wdth-normal.woff2?url';
import text from '../node_modules/@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2?url';

export const FONT_PRELOAD = { display, text };
