# ADR 0015 : fusion du « carnet d'interventions » avec le design d'Inkfolio

**Statut** : accepté (21 novembre 2026). Complète l'[ADR 0014](0014-carnet-d-interventions.md) : la feuille de classeur, les tickets, les tampons et les annotations restent ; l'accent, les liens, les coins, le bandeau et la mise en page des sections viennent du thème Astro Inkfolio.

## Contexte

Guillaume a demandé de garder l'inspiration portfolio et informatique du site mais de fusionner le thème actuel avec [Inkfolio](https://astro.build/themes/details/inkfolio/) (thème éditorial : papier chaud, un accent orange, filets fins, soulignement ondulé, titres de section à gauche).

**Licence** : Inkfolio est publié sous GPL-3.0. Ce dépôt est public et n'est pas sous GPL : **aucun code, CSS ni fichier d'Inkfolio n'est copié**. Seules des idées de design sont reprises (palette orange sur papier chaud, soulignement ondulé, coins doux, bandeau fixe, titres latéraux, barre de lecture), réécrites avec les jetons du site.

## Décisions

- **Accent orange** : `--accent` (texte, tampons : `#a83f00` en clair, 4,9:1 sur le papier ; `#ff7b1a` en sombre) et `--u` (`#ff6b01` / `#ff7b1a`, jamais du texte : soulignés ondulés, barre de lecture, fond du bouton au survol, avec `--u-ink` dessus). Le stylo bleu (`--pen`) reste pour les annotations, la page courante et le focus. Le rouge de tampon disparaît.
- **Liens** : à l'encre (`--link` = `--ink`), soulignés d'un trait **ondulé orange** ; le trait s'épaissit au survol. Menu, pied de page et listes ne soulignent qu'au survol.
- **Coins doux** : 6 px (étiquettes, puces), 9 px (champs), 11 px (boutons), 12 px (menus, boîtes de dialogue, terminal) ; la feuille et les filets restent carrés.
- **Bandeau fixe sur une ligne** (80 rem et plus) : nom, menu, recherche (icône), langue et Contact ; sous 80 rem il garde ses deux lignes et n'est pas fixe. Fine barre orange de progression de lecture en CSS seul (`animation-timeline: scroll()`, absente si le navigateur ne la gère pas ou si le mouvement réduit est demandé).
- **Accueil** : à partir de 76 rem, le titre de chaque section passe dans la marge gauche (reste visible en défilant) et le contenu à droite ; en dessous, titre au-dessus du contenu.
- **Boutons** : encre pleine ; survol orange (`--u`) avec texte `--u-ink`.

## Accessibilité

Aucune couleur de texte ne repose sur `--u` (2,5:1 sur le papier). Les liens sont identifiés par le soulignement, pas par la couleur. Contrastes vérifiés par `packages/ui/tests/contrast.test.ts` ; axe dans les deux thèmes.

## À savoir

- Les pages intérieures gardent leurs titres de rubrique au-dessus du contenu (double filet) : seule l'accueil a le titre latéral.
- `og/*.png` utilisent encore l'ancienne teinte de tampon : à régénérer au prochain changement de `postbuild.mjs`.
