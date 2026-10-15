// Polices à précharger (<link rel="preload">) : celles des grands titres, pour qu'elles soient prêtes au premier affichage.
// Mêmes fichiers que fonts.css (même chemin relatif) : le build n'en produit qu'une copie, le préchargement sert bien la feuille de style.
import frauncesItalic from '../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-italic.woff2?url';
import fraunces from '../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2?url';

export const FONT_PRELOAD = { fraunces, frauncesItalic };
