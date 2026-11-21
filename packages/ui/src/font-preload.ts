// Polices à précharger (<link rel="preload">) : texte courant et chasse fixe, pour qu'elles soient prêtes au premier affichage.
// Mêmes fichiers que fonts.css (même chemin relatif) : le build n'en produit qu'une copie, le préchargement sert bien la feuille de style.
import text from '../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2?url';
import mono from '../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2?url';

export const FONT_PRELOAD = { text, mono };
