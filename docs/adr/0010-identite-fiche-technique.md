# ADR 0010 : identité visuelle « fiche technique »

**Statut** : accepté (2026-10-15). Remplace la palette et les principes visuels de l'[ADR 0005](0005-identite-visuelle.md) ; le mécanisme (CSS à tokens, sans Tailwind, contrastes testés) est inchangé. **`packages/ui/src/tokens.css` fait foi.**

## Contexte

L'identité précédente (fond prune, accent corail, dégradé corail → violet sur le nom, halo animé, cartes identiques) était propre mais interchangeable : ce sont précisément les codes des portfolios générés en série. Le propriétaire la jugeait trop peu personnelle.

## Pistes comparées

| Piste                                                                                           | Pour                                                     | Contre                                                                          |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Console phosphore** (tout en chasse fixe, vert sur noir)                                      | Très « geek »                                            | Gadget, lecture longue pénible, le terminal du hero suffit à évoquer la console |
| **Éditorial chaud** (l'existant, retravaillé)                                                   | Rien à casser                                            | Ne résout pas le problème : reste générique                                     |
| **Fiche technique** (documentation d'équipement : graphite, voyant ambre, filets, numérotation) | Raconte le métier (baies, ports, schémas, documentation) | Demande de la retenue pour ne pas tourner au déguisement                        |

**Retenue : fiche technique.** Le site se lit comme la documentation soignée d'un technicien : sections numérotées, filets gradués, libellés en chasse fixe, trame de points, un seul voyant de couleur.

## Décisions

- **Palette** : sombre « baie » graphite neutre (`#0f1113`), clair « papier » (`#f4f1e9`). Un seul accent, l'ambre d'un voyant (`#f5a524` / `#a34a00`), un vert d'eau secondaire (`#7fd3c1` / `#0d6b61`) réservé aux détails (invite de commande). Plus aucun dégradé décoratif sur le texte ni les boutons.
- **Typographie** : inchangée en familles (aucune police ajoutée). Fraunces passe au fichier à **axe de taille optique** (`opsz`, +31 Ko en latin) : les grands titres prennent la coupe « display », plus serrée et plus contrastée. Libellés techniques en JetBrains Mono, capitales espacées (`.label`).
- **Formes** : rayons réduits (4 / 6 / 10 px), boutons à angles nets ; le bouton principal est un aplat d'accent dont l'ombre portée pleine apparaît au survol (effet « touche »). Cartes en aplat avec filet ; au survol, des repères d'angle (traits de coupe) s'allument.
- **Éléments signature** : `SectionHead` (numéro, titre, filet gradué, lien « tout voir ») ; voyant carré (`.led`, logo, favicon) ; sommaire du site sous le hero, avec les **nombres comptés au build** (réalisations, outils, cheatsheets, articles) ; domaines en « panneau de brassage » (ports numérotés) ; parcours en journal (dates en chasse fixe) ; fiche « En bref » des réalisations en tableau de caractéristiques.
- **Mouvement** : l'aurore animée en continu est supprimée. Restent des transitions courtes au survol (flèches qui glissent, voyants qui s'allument, repères d'angle) et l'apparition au défilement en CSS seul (`animation-timeline`), neutralisées par `prefers-reduced-motion`.
- **Mise en page** : asymétrie mesurée (réalisation principale sur deux rangées, sommaire en quatre colonnes, 2 × 2 sur mobile), listes en lignes plutôt qu'en cartes identiques quand le contenu est une liste.

## Conséquences

- Images de partage (`postbuild.mjs`), `og-image.png`, favicon et icônes régénérés aux nouvelles couleurs ; `theme-color` et manifeste alignés.
- Le portail Symfony hérite automatiquement des tokens.
- Contrastes : `packages/ui/tests/contrast.test.ts` passe dans les deux thèmes (texte ≥ 4,5:1, bordures ≥ 3:1).

## Mise à jour 2026-10-15 (soir) : plus éditorial, moins « gabarit »

Retour du propriétaire : garder ce thème, mais le rendre moins « IA », plus artistique.

- **Italique de Fraunces** (fichier `opsz` italique, téléchargé seulement si la page s'en sert) : le nom dans le hero, et un mot par titre de section de l'accueil (`*mot*` dans le texte, voir `SectionHead`).
- **Lignes de crête** (`HeroArt.astro`) : un relevé de signal empilé derrière le hero, calculé au build (SVG déterministe, aucun script), une trace en ambre ; dessiné une fois à l'arrivée, immobile si l'utilisateur réduit les animations, masqué en couleurs forcées.
- **Signature** : le nom en très grand, en creux, au bas de chaque page (décoratif, `aria-hidden`).
- **Sélecteur de thème en icônes** (libellés pour les lecteurs d'écran et en infobulle) : place gagnée pour le menu à sept entrées ; menu repliable sous 76rem.
- **Ton** : titres d'accueil plus parlés (« Ce que je sais faire », « Où j'ai travaillé »), moins d'insistance sur le traitement « dans le navigateur » (l'encadré Confidentialité ne reste que sur les outils où la question se pose).
