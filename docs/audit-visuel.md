# Audit visuel : ce qui fait « modèle généré » sur grichard.eu

**Date : 6 novembre 2026.** Captures de l'accueil, d'un article (`/blog/fin-support-windows-10-passer-a-windows-11/`), d'une cheatsheet (`/cheatsheets/gam/`), d'un outil (`/outils/dns/`) et d'une réalisation (`/projets/migrations-messagerie/`), en 1440, 768 et 375 px, thèmes clair et sombre, mouvement réduit (30 captures, prises sur le build local ; elles ne sont pas commitées, le script est décrit en fin de document). Référence de départ : [ADR 0010](adr/0010-identite-fiche-technique.md).

## 1. Synthèse

L'identité « fiche technique » a de bonnes idées (sections numérotées, voyant, libellés en chasse fixe, journal du parcours), mais **les deux thèmes tombent dans les deux looks les plus répandus des sites générés** :

- **clair** : fond papier crème (`#f4f1e9`), titres en sérif Fraunces, accent ambre-rouille (`#a34a00`) ;
- **sombre** : quasi-noir graphite (`#0f1113`) avec un seul accent vif (ambre `#f5a524`).

Et le texte courant est en **Inter**, la police « par défaut » à éviter. Le reste (hero, cartes, mot en italique) amplifie l'effet.

## 2. Constats, par point de la grille

| Point                                        | Constat                                                                                                                                                                                                                      | Où                            | Gravité |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------- |
| Hero centré, gros titre, sous-titre, boutons | Pas centré, mais la formule exacte : « Bonjour, je suis » + nom géant, paragraphe, **trois** boutons, terminal à droite, lignes de crête en fond.                                                                            | Accueil                       | Haute   |
| Grilles de cartes identiques                 | Compétences en grille 3 × 2 de cartes identiques (numéro, titre, ligne) ; outils en grille 2 × 3 avec la même icône Lucide par carte ; réalisations en cartes de même style, même coin, même filet.                          | Accueil, Outils, Réalisations | Haute   |
| Dégradés, halos, verre                       | Supprimés en octobre (ADR 0010). Reste la trame de points en fond, cohérente avec le thème.                                                                                                                                  | —                             | Faible  |
| Emojis, pictogrammes génériques              | Pas d'emoji. Icônes Lucide génériques sur les outils et dans le menu « Outils ».                                                                                                                                             | Outils, menu                  | Moyenne |
| Rythme régulier des sections                 | Toutes les sections de l'accueil ont la même forme : numéro, titre avec un mot en italique doré, lien « Tout voir » à droite, filet gradué, puis grille. Six fois de suite.                                                  | Accueil                       | Haute   |
| Police générique                             | Texte en Inter (le site le dit lui-même : « Inter Fallback »). Fraunces en titres, très utilisée depuis 2023 dans les gabarits « éditoriaux ».                                                                               | Partout                       | Haute   |
| Badges « pill », bordures, ombres identiques | Puces de tags arrondies partout ; `--shadow-card` sur les cartes ; mêmes bordures grises sur tous les blocs.                                                                                                                 | Blog, cartes                  | Moyenne |
| Animations d'apparition au défilement        | Présentes en CSS (`animation-timeline`), neutralisées par `prefers-reduced-motion`. Systématiques sur les blocs de l'accueil.                                                                                                | Accueil                       | Moyenne |
| Tic typographique                            | Un mot en italique doré par titre (« Ce que je sais _faire_ », « Quelques _réalisations_ », « Des _outils_ », « Où j'ai _travaillé_ », « À lire, à _garder_ »). Une fois, c'est une signature ; cinq fois, c'est un procédé. | Accueil                       | Moyenne |
| Signature géante en pied de page             | Le nom en très grand, en creux : effet « portfolio de designer » courant.                                                                                                                                                    | Toutes les pages              | Faible  |

## 3. Constats propres au mobile (375 px)

- **En-tête sur deux lignes** : logo et « Contact » sur la première, bouton « Menu » seul sur la deuxième. Environ 110 px perdus en haut de chaque page.
- **Bandeau cookies** : il occupe près de la moitié de l'écran à l'arrivée et masque le début du contenu (accueil, article, cheatsheet).
- **Cheatsheet GAM** : titre sur cinq lignes, puis l'introduction et l'avertissement de source : la recherche, raison d'être de la page, n'apparaît qu'après plus d'un écran et demi.
- **Sommaire d'article** : numérotation en double (« 04. 4. Si un poste… ») parce que les intertitres contiennent déjà leur numéro.
- Le parcours mobile reproduit la page desktop en une colonne : rien n'est pensé pour le pouce (recherche, sommaire, retour en haut).

## 4. Ce qui fonctionne et doit rester

- Sections numérotées quand l'ordre est une information (procédures, étapes d'article).
- Libellés en chasse fixe et dates en chiffres tabulaires (parcours en journal).
- Fiche « En bref » des réalisations en tableau de caractéristiques.
- Contrastes AA vérifiés par test dans les deux thèmes, focus visible, aucune animation sans repli.
- Poids raisonnable : CSS principal 48 Ko, polices critiques préchargées (Fraunces 68 Ko).

## 5. Poids des polices (build du 6 novembre 2026)

| Fichier                                             | Ko  |
| --------------------------------------------------- | --- |
| Inter latin + latin-ext                             | 132 |
| Fraunces opsz (droit + italique, latin + latin-ext) | 280 |
| JetBrains Mono latin + latin-ext                    | 56  |

Les fichiers `latin-ext` ne se chargent que si la page en a besoin (`unicode-range`), mais l'italique de Fraunces (152 Ko) est chargé sur l'accueil pour un mot par titre.

## 6. Directions proposées

Trois directions, montrées en situation dans une page de maquettes privée (lien donné à Guillaume) :

- **A. Manuel d'intervention** : papier millimétré bleuté, colonne de marge (référence, révision, public), sections « § 2 », titres en Martian Mono, texte en Source Serif 4, accent bleu cyanotype.
- **B. Carnet d'atelier** : éditorial asymétrique, grand titre condensé en Bricolage Grotesque, texte en Literata, index des articles en tableau daté, notes en marge, vert « câble » en surligneur.
- **C. Étiquetage de baie** : rubans d'étiqueteuse jaunes, capitales condensées en Archivo (axe de largeur), texte en Atkinson Hyperlegible Next, rubriques codées avec les couleurs des paires T568B.

**Rien n'est appliqué avant le choix de Guillaume** (une direction, ou un mélange explicite).

## 7. Refaire les captures

Avec le build et `astro preview` lancés (port 4321), un script Playwright parcourt les cinq pages pour chaque largeur et chaque thème (`localStorage.theme` posé avant le chargement, `reducedMotion: 'reduce'`) et enregistre une capture pleine page.

## 8. Après la refonte (7 novembre 2026)

Mesures sur le build local servi en HTTP (Lighthouse 13, mêmes catégories que l'[audit d'octobre](audit/2026-10-refonte-apres.md)). Performance / accessibilité / bonnes pratiques / SEO :

| Page                              | Mobile                | Desktop               | LCP mobile | CLS | Poids de la page |
| --------------------------------- | --------------------- | --------------------- | ---------- | --- | ---------------- |
| `/`                               | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0,9 s      | 0   | 188 Ko           |
| `/blog/fin-support-windows-10-…/` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0,9 s      | 0   | 181 Ko           |
| `/cheatsheets/gam/`               | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0,9 s      | 0   | 204 Ko           |
| `/projets/migrations-messagerie/` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0,9 s      | 0   | 177 Ko           |

À l'audit d'octobre, l'accueil mobile était à 96 en performance. Gains : une seule police de titres au lieu de deux (plus d'italique de 80 Ko), aucune illustration SVG animée sur l'accueil, plus d'apparition au défilement.

Contrôles : axe (WCAG 2.2 A et AA) vert dans les deux thèmes sur toutes les pages testées par la CI ; rendu relevé à 1440, 768 et 375 px sur l'accueil, un article, une cheatsheet, un outil et une réalisation.

### Ce que cet audit ne mesure pas

Navigation au clavier de bout en bout et lecteur d'écran : à refaire à la main par le propriétaire sur le site en ligne (voir le résumé de livraison).

## 9. Édition relevé (7 novembre 2026)

Suite à cet audit, la composition a été reprise (ADR 0012). Défauts corrigés : vide sous le pied de page quand le bandeau de cookies est affiché (rembourrage de 12 rem sur `body` supprimé, bandeau dans le flux), signature du pied de page coupée (SVG ajusté à la largeur), catégories collées aux articles sur le blog (48 px entre chaque zone), cartes identiques sur les listes (lignes de registre). Contrôles : `pnpm verify` (axe dans les deux thèmes, contrat des URL) ; rendu relevé à 1440, 768 et 375 px.
