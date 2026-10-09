# AGENTS.md

Instructions pour les agents de code (tout outil). Version détaillée pour Claude Code : [CLAUDE.md](CLAUDE.md) ; gardez les deux synchronisés.

## Projet et contrainte d'hébergement

Monorepo de grichard.eu. Production sur OVH mutualisé : **fichiers statiques + PHP 8.5 uniquement**, accès **FTP seul** (ni SSH, ni MySQL, ni Node, ni Docker). Node et pnpm ne servent qu'au build (local, GitHub Actions). Le site en ligne est `apps/web` + `apps/api` ; l'ancien site reste dans `legacy/` (référence, à ne pas supprimer sans accord du propriétaire).

## Commandes

`pnpm install` · `pnpm format:check` · `pnpm legacy:check` · `pnpm legacy:build` · `pnpm test:contract` · `pnpm audit:prod` · site : `pnpm --filter @grichard/web build|check|lint|test:e2e` · design system : `pnpm --filter @grichard/ui test` · outils : `pnpm --filter @grichard/tools-core check|test` · contrat du nouveau site : `CONTRACT_DIST=apps/web/dist pnpm test:contract` · API PHP (dans `apps/api`) : `composer install`, `composer test|cs|stan`. Portail Symfony (dans `apps/portal`) : `composer install`, `composer test|cs|stan` ; doc : docs/portail.md et docs/deploiement.md. Le `.htaccess` est généré par `apps/web/scripts/lib/htaccess.mjs` (ne pas l'éditer à la main).

## Structure cible

`apps/web` (Astro statique FR/EN), `apps/api` (PHP, formulaire de contact), `apps/portal` (Symfony, espace client de test, SQLite), `packages/ui|tools-core|config|content-schema`, `docs/adr/` (décisions).

## Règles

- **Push direct sur `main`, pas de PR, pas de préproduction** : chaque push sur `main` est livré en production automatiquement après une CI verte. Commits Conventional Commits en français, atomiques, chacun laissant le site fonctionnel (fonctionnalité inachevée masquée).
- Avant chaque push : `pnpm format:check`, lint/typecheck/tests/e2e de ce qui est touché, `composer test|cs|stan` et `php -l` pour le PHP, contrat d'URL, rendu 1440/768/375 px au clavier dans les deux thèmes, `git diff --staged` sans secret. Échec = on corrige avant de pousser. Régression en ligne = `git revert` + push.
- Pas de couleur en dur (tokens `packages/ui`), pas de `<style>` ni de script en ligne (CSP) ; pas d'attribut `style=""` écrit à la main.
- TypeScript strict ; PHP `strict_types`, PER-CS, PHPStan max, PHPUnit.
- Aucun secret dans le dépôt public ; CSP sans `unsafe-inline` pour les scripts ; SQL préparé ; Argon2id ; CSRF ; cookies `HttpOnly`/`Secure`/`SameSite`.
- WCAG 2.2 AA : sémantique, focus visible, contrastes dans les deux thèmes, mouvement réduit respecté, axe vert.
- Ne jamais casser une URL publique (redirection 301 + contrat `tests/contract/contract.json` à jour), ni ajouter de dépendance sans justification, ni introduire Node en production, ni pousser un état non vérifié sur `main`, ni créer de préproduction, ni toucher au DNS, aux secrets ou aux réglages GitHub.

## Terminé =

Build, lint, typecheck, tests, contrat d'URL et axe verts ; poussé sur `main`, déploiement vert et contrat vérifié en ligne ; documentation à jour ; résumé : fait, reste, risques, vérifications à faire par le propriétaire.
