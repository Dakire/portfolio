# ADR 0006 : outils en Preact, logique pure dans `packages/tools-core`

**Statut** : accepté (2026-10-08)

**Décision.**

- La **logique** des dix outils (DNS, ICS, JSON, réseau, encodage, mots de passe, unités…) vit dans `packages/tools-core` : TypeScript strict, aucune dépendance, aucun DOM, aucun texte d'interface. Elle est testée seule (318 tests) et ne change pas d'un framework à l'autre.
- Les **textes** (FR/EN, messages de constats, FAQ) et les **interfaces** vivent dans `apps/web/src/tools/<id>/` : `text.ts` (typé) et `Tool.tsx` (Preact).
- Chaque page d'outil est rendue en HTML statique au build (explications, FAQ, JSON-LD lisibles sans JavaScript) ; seul l'outil est hydraté (`client:load`).
- Le registre `src/tools/registry.ts` est la seule liste : page « Outils », accueil, `llms.txt`, sitemap, tests.

**Pourquoi Preact (≈ 4 Ko) et non React (≈ 70 Ko).** Mêmes hooks et même JSX ; la page d'un outil télécharge environ 60 Ko de moins. Pas de couche de compatibilité React : les composants utilisent `onInput`, `class` et les types de Preact 11.

**Scripts en ligne.** L'hydratation d'Astro ajoute deux petits scripts et une feuille de style en ligne, identiques sur toutes les pages d'outils. `scripts/postbuild.mjs` calcule leurs empreintes SHA-256 (`.cache/csp-hashes.json`) ; la CSP de production les autorise par empreinte, sans `'unsafe-inline'`.

**Conséquences.** Ajouter un outil = un dossier dans `apps/web/src/tools/`, une entrée dans le registre, une ligne dans `ToolPage.astro` (Astro doit connaître chaque composant interactif à la compilation) et la logique éventuelle dans `tools-core`. Les tests de cohérence (parité FR/EN, composants branchés, catalogues de messages complets) échouent s'il manque l'un de ces éléments.
