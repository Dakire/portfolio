# AGENTS.md

Instructions pour les agents de code (tout outil). Version détaillée pour Claude Code : [CLAUDE.md](CLAUDE.md) ; gardez les deux synchronisés.

## Projet et contrainte d'hébergement

Monorepo de grichard.eu. Production sur OVH mutualisé : **fichiers statiques + PHP 8.5 uniquement**, accès **FTP seul** (ni SSH, ni MySQL, ni Node, ni Docker). Node et pnpm ne servent qu'au build (local, GitHub Actions). Le site actuel est dans `legacy/` (référence, à ne pas supprimer avant la bascule).

## Commandes

`pnpm install` · `pnpm format:check` · `pnpm legacy:check` · `pnpm legacy:build` · `pnpm test:contract` · `pnpm audit:prod` · site : `pnpm --filter @grichard/web build|check|lint|test:e2e` · design system : `pnpm --filter @grichard/ui test`.

## Structure cible

`apps/web` (Astro statique FR/EN), `apps/api` (PHP, formulaire de contact), `apps/portal` (Symfony, espace client de test, SQLite), `packages/ui|tools-core|config|content-schema`, `docs/adr/` (décisions).

## Règles

- Commits Conventional Commits en français, atomiques ; une PR par phase vers `refonte/monorepo` ; pas de push sur `main` pendant la refonte.
- Pas de couleur en dur (tokens `packages/ui`), pas de `<style>` ni de script en ligne (CSP) ; pas d'attribut `style=""` écrit à la main.
- TypeScript strict ; PHP `strict_types`, PER-CS, PHPStan max, PHPUnit.
- Aucun secret dans le dépôt public ; CSP sans `unsafe-inline` pour les scripts ; SQL préparé ; Argon2id ; CSRF ; cookies `HttpOnly`/`Secure`/`SameSite`.
- WCAG 2.2 AA : sémantique, focus visible, contrastes dans les deux thèmes, mouvement réduit respecté, axe vert.
- Ne jamais casser une URL publique (redirection 301 + contrat `tests/contract/contract.json` à jour), ni ajouter de dépendance sans justification, ni introduire Node en production, ni déclencher un déploiement en production, ni toucher au DNS ou aux secrets.

## Terminé =

Build, lint, typecheck, tests, contrat d'URL et axe verts ; documentation à jour ; résumé : fait, reste, risques, vérifications à faire par le propriétaire.
