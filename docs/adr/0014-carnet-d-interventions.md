# ADR 0014 : « carnet d'interventions », refonte complète de l'identité

**Statut** : accepté (21 novembre 2026). Remplace l'identité « Pit wall » (carbone, lime, coins coupés) et les ADR 0010 à 0013 pour tout ce qui touche à l'apparence ; la structure des pages (ADR 0009, 0012) et la contrainte de production (fichiers statiques + PHP) restent valables.

## Contexte

Le thème précédent (lime fluo sur carbone, hero « titre + deux boutons », pile de cartes identiques) ressemblait à un site généré. Quatre identités s'étaient empilées en quelques semaines dans `site.css` (3 100 lignes), `components.css`, `pitwall.css`. Quatre directions ont été maquettées (`design-proposals/`, hors build) ; Guillaume a choisi **A (fiche d'intervention), poussée beaucoup plus loin, avec la grille et le grand nom de C**, un thème clair par défaut, aucun bouton de thème dans l'en-tête et un curseur actif par défaut.

## Décisions

- **La page est une feuille de classeur** posée sur un bureau (`.sheet`, `base.css`) : marge à double filet rouge et perforations sur grand écran (dégradés CSS, aucune image), pleine largeur sans décor sur petit écran. Papier cassé `#f4efe3` (clair, défaut) ou papier de nuit brun-noir `#17130e` : jamais de noir pur ni de gris froid.
- **Deux encres, comme sur une fiche** : le tampon rouge (`--accent`, statuts, marge, survols) et le stylo bleu (`--pen`, liens et annotations). Rien d'autre ; vert, ambre, rouge d'état seulement pour les états, toujours doublés d'un mot.
- **Deux familles** : Newsreader (titres et texte, variable, avec italique) et IBM Plex Mono (annotations, champs, code). Le grand nom de l'accueil est en Newsreader 700 / 300 italique, l'italique décalé d'un tiers.
- **Vocabulaire de composants** (`components.css`) : `.rubric` (double filet, titre, mention en mono), `.ledger-row` (ligne de registre), `.ticket` (numéro de ticket), `.note` (annotation au stylo bleu), `.stamp` (tampon, seul endroit où les capitales sont admises), `.band` (bande d'encre inversée), `.card` / `.tile` (fiche), `.label`, `.field`, `.table`, `.chip`, `.alert`, `.btn`.
- **Références** (`lib/ticket.ts`) : `GR-R01`… par réalisation (rang dans la liste), ticket d'article `AAAAMMJJ-RUB` (date de publication et code de rubrique). Identifiants dérivés de données existantes, rien d'inventé.
- **Accueil** : fiche d'identification (nom en grand, photo d'identité, faits tirés du profil), index typographique des 12 réalisations (aperçu déployé au survol ou au focus, toujours ouvert en tactile), domaines cochés, frise du parcours, terminal en « relevé », carnet de terrain, outils en une phrase de liens, contact en bande d'encre.
- **Menu** : nom et sous-titre à gauche, recherche, langue et Contact à droite, liens sur une seconde ligne ; la page courante est entourée au stylo (masque SVG teinté par `--pen`). Sous-menu Outils en fiche d'index. Plus de bouton de thème dans l'en-tête.
- **Réglages de lecture** dans le pied de page : papier (clair, sombre, système) et curseur (carnet ou système). **Sans choix mémorisé, le thème est clair**, quel que soit le système ; « système » est un choix explicite. Le choix du curseur est mémorisé sous `cursor` (`off` pour le couper).
- **Curseur actif par défaut** (pointeur fin, hors couleurs forcées) : flèche et main (curseur Windows classique) en orange du site, contour d'encre et halo clair, la main plus foncée à l'appui ; aucune bulle, aucun JavaScript de suivi. Une image de curseur ne lisant pas `var()`, les images (data: SVG, une par forme et par thème, plus une main foncée pendant l'appui) sont dans `packages/ui/src/cursor.css`, sans requête ni clignotement au premier survol. Champs de texte et éléments désactivés gardent le curseur natif.
- **Retirés** : `pitwall.css`, les bandes colorées en deux tons et les formes (`Shape`, `.page-bg`), les coins coupés, le cadre de portrait avec légendes tracées, la signature en contour du pied de page, Bricolage Grotesque, Atkinson Hyperlegible Next et JetBrains Mono (remplacées par Newsreader et IBM Plex Mono).

## Accessibilité

Contrastes mesurés (tableau dans `packages/ui/tests/contrast.test.ts`) : texte 15,1:1 (clair) et 14,8:1 (sombre), texte secondaire 6,3:1 et 7,8:1, lien 7,5:1 et 7,4:1, tampon 6,1:1 et 7,0:1. Bordures de champs et de boutons à 3:1 minimum ; les filets décoratifs plus pâles ne délimitent jamais une commande. Focus visible en bleu de stylo (7,5:1). Cibles de 44 px. Le survol de l'index des réalisations ne porte aucune information absente au clavier (même effet au focus).

## Conséquences

- Les jetons gardent leurs noms (`--canvas`, `--surface`, `--ink`, `--accent`, `--line-strong`…) : l'espace client (`apps/portal`, qui a sa propre `portal.css`) et les outils n'en dépendent pas autrement.
- `og/*.png` et la page de style `/design/` doivent suivre la nouvelle identité.
