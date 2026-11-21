# PROGRESS

## État

- Phase 1 (audit) : **faite** → `THEME-MERGE-AUDIT.md`.
- Phase 2 (maquette) : **faite**, `mockups/index.html`, en attente de validation.
- Phase 3 : lots 1 et 2 faits ; lots 3-10 à faire.
- Phase 4 : à faire.

## Décisions

- Identité « carnet » (ADR 0014/0015) remplacée par un thème sombre sobre ; clair conservé en variante explicite. ADR 0016 à écrire au lot 1.
- Recherche globale : Pagefind (remplace `search.js` et `/search-index.json` ; cheatsheets gardent MiniSearch).
- Références : inspiration seulement, aucun code copié (Astro Developer Theme sans licence ; Astrofy et terminal-portfolio MIT, non portés).
- Branche de travail : push direct sur `main` après `pnpm verify` (règle du dépôt).

## Points ouverts / données manquantes

- Statut de disponibilité réel : aucune donnée → pas d'indicateur tant que Guillaume ne le fournit pas.
- Aperçus (captures) des projets, dépôts GitHub publics par projet : non fournis.
- Menu : « Expériences » du brief = `/parcours/` existant ? À confirmer en phase 2.
- Police sans (Geist, repli Inter) : disponibilité fontsource à vérifier.
- Mise à jour de CLAUDE.md et AGENTS.md (synchronisés) au lot 1.

## Lot 1 (tokens et composants de base) : fait, non poussé

- `tokens.css` réécrit (sombre défaut, `data-theme='light'`), Geist remplace Newsreader (fonts, préchargement, postbuild OG), `theme.js` défaut sombre, `.sheet` sans marge/perforations, liens soulignés droits, `.stamp` en badge, cartes sans ombre. ADR 0016, CLAUDE.md et AGENTS.md à jour.
- Vérifié : `astro check` 0 erreur, build OK (clé Turnstile factice en local), vitest web 1739 verts, tests contraste ui 19 verts. e2e/axe non relancés (à faire avant push via `pnpm verify`).
- Reste du carnet à retirer : `cursor.css` (lot 2/10), références `GR-Rxx`, bandeau « carnet » de l'en-tête, OG cards (palette claire, lot 10), pages `/design/`.
- Note : `dist-preprod` résiduel, à supprimer sur accord.

## Lot 2 (layout, header, footer, navigation) : fait, non poussé

- En-tête : filet fin, nav à fond de survol et page courante soulignée en bleu acier (plus de masque SVG au stylo), boutons à coins doux, bouton primaire en accent ambre, intitulé « technicien informatique » (plus « carnet d'interventions »). Pied de page : filets fins. Menu mobile et sous-menu Outils restylés. Vérifié en 1440 et 375 px (captures), e2e 277 verts, vitest 1739 verts.
- Lien `>_` vers `/terminal/` volontairement absent : la page n'existe qu'au lot 6 (fonctionnalité inachevée = masquée).
- Reste carnet : accueil (« Fiche d'identification », « carnet »), `.rubric` à double filet, `GR-Rxx`, `cursor.css` → lots 3 à 10.
