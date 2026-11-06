# ADR 0011 : identité « fiche technique, édition atelier »

**Statut** : accepté (6 novembre 2026). Fait évoluer l'[ADR 0010](0010-identite-fiche-technique.md) (palette, polices, mise en page) ; le mécanisme (CSS à tokens, sans framework, contrastes testés) est inchangé. **`packages/ui/src/tokens.css` fait foi.**

## Contexte

L'audit visuel du 6 novembre 2026 ([audit-visuel.md](../audit-visuel.md)) a montré que l'identité d'octobre tombait dans les deux looks les plus courants des sites générés : papier crème avec titres en sérif et accent terracotta en clair, quasi-noir avec un seul accent vif en sombre. Le texte était en Inter, six sections de l'accueil avaient exactement la même forme, et chaque titre portait un mot en italique doré.

Trois directions ont été comparées (manuel d'intervention, carnet d'atelier, étiquetage de baie). Le propriétaire a demandé un mélange de l'existant avec deux sites de référence :

- **braydoncoyer.dev** : page tenue dans une colonne encadrée à rails hachurés, filets de construction qui traversent la page, sur-titres posés sur un filet, menu en pastille, grille de tuiles qui montrent un vrai contenu ;
- **rafa.design** : nom très présent, sections en bandes de fond alternées, un grand titre par projet, mise en page franche sans cartes.

## Décisions

- **Polices** (auto-hébergées, OFL, `font-synthesis: none`) : **Bricolage Grotesque** pour les titres (axe de largeur, 82 % par défaut pour les grands titres), **Atkinson Hyperlegible Next** pour le texte (lettres sans ambiguïté), **JetBrains Mono** pour le code et les libellés, ligatures désactivées. Inter et Fraunces sont retirées (≈ 150 Ko de moins dans le jeu de polices). Les titres sont en `font-display: optional` et préchargés.
- **Couleurs** : clair en **gris aluminium** (`#f3f4f5`) au lieu du papier crème ; sombre en **graphite bleuté** (`#101316`) pensé séparément. L'ambre du voyant reste le seul accent. Ajouts : `--guide` (lignes de construction), `--band-*` (bande inversée : sombre en thème clair, plus claire que le fond en thème sombre). Le test `packages/ui/tests/contrast.test.ts` couvre les bandes.
- **Cadre de page** : deux rails hachurés (`.page-rails`) de part et d'autre de la colonne de contenu à partir de 82 rem ; menu principal en pastille ; en-tête sur une ligne à 375 px ; bandeau cookies en carte compacte sur mobile.
- **Composants** : `.rule-label` (sur-titre sur filet), `.tile` (le seul grand rayon, `--radius-tile`), `.band` et `BandEdge` (bord de bande en trace de signal ambre, calculé au build), `.spec-sheet` (fiche « En bref »), `.steps` (étapes numérotées, seule numérotation conservée avec le sommaire).
- **Accueil** : le nom en très grand sur deux lignes, réalisations dans une bande inversée (un grand titre par projet, fiche à droite), outils en tuiles avec une vraie recherche (« deleguer » trouve la commande GAM), parcours et derniers articles côte à côte. Plus de lignes de crête, de mot en italique, de numérotation décorative ni d'apparition animée au défilement.
- **Article** : sommaire à gauche, colonne de lecture, « Pour aller plus loin » en note de marge à droite avec un filet ambre ; en une colonne sur mobile, le sommaire passe avant le texte.
- **Cheatsheets** : sommaire « Sur cette page », recherche sous le titre, avertissement de source en note ; fiches de résultat en aplat.
- **Images de partage** : colonne encadrée, rails hachurés, titre en Bricolage condensée, générées au build avec les nouvelles polices.

## Écarté

- **Portrait qui dépasse sur la bande** (idée de Rafa) : il faut une photo détourée, à fournir par le propriétaire ; l'accueil fonctionne sans. À ajouter quand elle existera.
- **Vagues** pour les bords de bande : remplacées par une trace de signal, cohérente avec le thème « mesure » et sans copier la signature de Rafa.
- **Grille de cartes uniformes** pour les réalisations : la page liste garde des cartes (contenu comparable), l'accueil et chaque fiche n'en ont plus.

## Conséquences

- `Base.astro` ne précharge plus que deux fichiers de police (titres, texte) ; `Home.astro` n'a plus d'option `preloadItalic`.
- Le portail Symfony hérite des tokens ; ses gabarits n'utilisent pas les polices du site.
- La page `/design/` (build avec `STYLEGUIDE=1`) documente les nouveaux éléments.
- Réalisations : les blocs `context`, `role`, `steps`, `result` sont toujours masqués s'ils sont vides ; la mise en page prévoit le récit quand ils seront rédigés.
