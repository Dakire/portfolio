# ADR 0013 : cartes colorées en deux tons, formes douces, interface moins « générée »

**Statut** : accepté (10 novembre 2026). Remplace la composition graphique de l'[ADR 0012](0012-edition-releve.md) (règle graduée, rails, trame, contours) ; la structure des pages et les conventions d'interface de l'ADR 0012 restent valables.

## Contexte

Le thème « fiche technique » (graphite bleuté, ambre, traits fins, capitales en chasse fixe, curseur animé) ressemblait trop à un modèle généré : couleurs et décors interchangeables, beaucoup de traits décoratifs sans information. Guillaume a demandé un thème plus original, moins chargé en traits, avec des sections colorées mais sobres.

## Décisions

- **Palette « encre »** : noir chaud et papier, un seul accent terracotta (jetons de `packages/ui/src/tokens.css`). Le graphite bleuté et l'ambre sont abandonnés.
- **Cartes colorées** (`.band`, `packages/ui/src/components.css`) : une section colorée est une carte arrondie (1,75 rem) posée sur le fond de page, à la largeur du contenu, et non plus un bandeau pleine largeur. Les jetons de la carte (`--ink`, `--accent`, `--surface`…) sont redéfinis à l'intérieur : tout composant s'y adapte sans règle propre.
- **Deux tons seulement** (`--tone-*`, helper `tone(i)` dans `src/lib/tones.ts`) qui alternent : bruns doux en thème sombre, sable et pêche pâles en thème clair. Textes et accents testés à 4,5:1 minimum. Cinq teintes avaient été essayées : jugées « arc-en-ciel ».
- **Moins de cartes** : sur l'accueil, seules Réalisations et Blog sont des cartes ; Profil et Outils restent sur le fond de page ; le Contact est une carte d'accent (`.hm-contact`).
- **Formes douces** : `Shape.astro` (blob dans un coin, vague en bas) rognées par la carte, placées sur la première carte d'une page et quelques autres ; deux grands blobs en fond de page (`.page-bg`, dans `Base.astro`). Décoratifs, `aria-hidden`, masqués à l'impression et en couleurs forcées. Pas partout : la modération est voulue.
- **Menu** : liens nus, page courante et survol soulignés à l'accent (plus de pilule) ; sous-menu Outils au même style (panneau sans arrondi, filet d'accent).
- **Libellés** : plus de capitales espacées en chasse fixe (`.label`, `.tag`, titres de colonne) ; texte courant en sourdine.
- **Retirés** : curseur animé et son interrupteur, rails hachurés, règle graduée, trame de points, chiffres de section et signature en contour, cercles du bandeau de contact, légendes tracées du portrait.
- **Espacement des pages** : le bas de l'en-tête (`.page-hero`) fournit tout l'espace avant le contenu ; les sections ne le doublent pas (`.page-hero + .section`, `.blog-page`).
- **Pages mises en cartes** : Compétences, Réalisations, Parcours (fiche par poste : `.job`), Blog (un bandeau par mois, articles en lignes `.post-row`), Outils, Cheatsheets (une carte par aide-mémoire, bloc de recherche en carte).

## Pièges rencontrés

- Une propriété personnalisée qui se référence elle-même est invalide : pour éclaircir `--danger` dans une carte, on utilise des jetons dédiés (`--tone-danger`, `--tone-ok`, `--tone-warn`), pas `color-mix` sur `--danger`.
- `.band` pose `--selection` : sans cela, le surlignage des résultats de recherche (`mark`) manquait de contraste sur le fond de la carte (axe).
- Un sélecteur plus précis (`.site-nav > ul > li > a`) l'emporte sur la règle de remplissage resserré du grand écran : ne pas y remettre de `padding`.
- `body { position: relative }` est nécessaire pour que `.page-bg` couvre toute la hauteur du document ; `overflow: hidden` sur `.page-bg` évite tout défilement horizontal.
- Une ancienne règle `padding-top: 0` (`.hm-tools`) collait la section Outils à la carte précédente : les règles d'espacement d'une section ne doivent pas supposer la section voisine.
