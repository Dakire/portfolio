# ADR 0005 : identité visuelle « pro / geek / IT » et CSS à tokens (sans Tailwind)

**Statut** : accepté (2026-10-08). Choix faits par l'assistant sans maquette préalable : à réviser par le propriétaire (voir « Comment changer »).

**Direction.** Sobre et technique, aux codes de 2026-2027 : neutres froids, un seul accent, typographie Inter (texte) et JetBrains Mono (métadonnées, code, invites `~/section`), grille visible et discrète, cartes à bordure fine, aucun effet décoratif (ni verre dépoli, ni halo qui suit la souris, ni animation en continu).

**Couleurs.** Fond `#0a0c0f` (sombre) / `#f7f8fa` (clair). Accent « vert signal » : `#3ddc97` en sombre, `#0b7a52` en clair. Liens en cyan (`#5eead4` / `#0a6a8a`). Thème auto, clair ou sombre, sans flash.

**Pourquoi du CSS à tokens plutôt que Tailwind** (écart par rapport à l'ADR 0003). L'espace client PHP doit reprendre exactement la même identité sans étape de build : `tokens.css`, `base.css` et `components.css` sont des fichiers CSS simples que Symfony charge tels quels. Cela supprime aussi une dépendance et son maintien.

**Garde-fous automatiques.** `packages/ui/tests/contrast.test.ts` lit `tokens.css` et échoue si un texte passe sous 4,5:1, une bordure d'interface sous 3:1, ou si le thème « système sans JavaScript » diverge du thème clair. axe (WCAG 2.2 AA) tourne sur la page de style dans les deux thèmes.

**Comment changer.** Modifier uniquement `packages/ui/src/tokens.css` (couleurs, polices, échelles), puis `pnpm --filter @grichard/ui test`. La page `/design/` (développement, ou `STYLEGUIDE=1` en préproduction) montre le résultat.

**Scripts et styles.** Jamais de script ni de style en ligne (CSP) : le script de thème est un fichier externe bloquant, versionné par empreinte. Pas d'attribut `style=""` écrit à la main : utiliser des classes. **Compromis assumé** : la coloration syntaxique (Shiki) génère des attributs `style` (variables CSS par thème) ; la CSP de production les autorise via `style-src-attr 'unsafe-inline'` tout en gardant `style-src 'self'` pour les feuilles de style (aucun `<style>` en ligne). Un attribut `style` ne peut pas exécuter de script ; le risque résiduel est celui de l'injection de style, limité par l'absence de contenu utilisateur sur le site.
