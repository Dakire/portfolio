# CLAUDE.md

Contexte pour Claude Code. Le même contenu, formulé pour d'autres agents, est dans [AGENTS.md](AGENTS.md) : gardez les deux fichiers synchronisés.

## Projet

Monorepo de **grichard.eu** (portfolio, blog, outils en ligne, espace client de test). Le site en ligne est `apps/web` (Astro) + `apps/api` (PHP) ; l'ancien site reste dans `legacy/` comme référence.

## Contrainte non négociable : production = fichiers statiques + PHP 8.5

Hébergement OVH « hosting-free », **accès FTP uniquement** (pas de SSH, pas de MySQL, pas de multisite, pas de Node, pas de daemon, pas de Docker).
Node et pnpm n'existent qu'au **build** (local et GitHub Actions). Ce qui est déployé : HTML/CSS/JS/PDF statiques, `.htaccess`, PHP avec son `vendor/` construit en CI. Base de données du portail : SQLite (fichier hors webroot).
Ne jamais introduire de dépendance d'exécution Node, ni d'appel à un service nécessitant un serveur applicatif.

## Commandes (racine)

| Besoin                            | Commande                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| Installer                         | `pnpm install` (installe aussi les hooks)                                                    |
| Formater / vérifier               | `pnpm format` / `pnpm format:check`                                                          |
| **Tout vérifier avant un push**   | `pnpm verify` (mêmes contrôles que la CI, PHP compris ; `--no-e2e` pour aller plus vite)     |
| Site actuel : build               | `pnpm legacy:build`                                                                          |
| Site actuel : lint+tests+e2e      | `pnpm legacy:check`                                                                          |
| Contrat des 70 URL publiques      | `pnpm test:contract` (après un build complet)                                                |
| Contrat sur le site en ligne      | `CONTRACT_BASE_URL=https://grichard.eu pnpm test:contract`                                   |
| Audit des dépendances             | `pnpm audit:prod`                                                                            |
| Site (Astro) : dev                | `pnpm --filter @grichard/web dev` (page de style : `/design/`)                               |
| Site : build / types / lint       | `pnpm --filter @grichard/web build` / `check` / `lint`                                       |
| Site : e2e + axe                  | `pnpm --filter @grichard/web test:e2e`                                                       |
| Design system : tests             | `pnpm --filter @grichard/ui test`                                                            |
| API PHP : installer               | `cd apps/api && composer install`                                                            |
| API PHP : tests / style / analyse | `composer test` / `composer cs` / `composer stan` (dans `apps/api`)                          |
| Contrat sur le nouveau site       | `CONTRACT_DIST=apps/web/dist pnpm test:contract` (après `pnpm --filter @grichard/web build`) |

Le `.htaccess` (CSP, en-têtes, cache, redirections) est généré dans `dist/` par `apps/web/scripts/lib/htaccess.mjs` : ne pas l'écrire à la main. Portail Symfony (`apps/portal`, voir [docs/portail.md](docs/portail.md)) : `composer install`, `composer test|cs|stan` dans `apps/portal`. Déploiement : [docs/deploiement.md](docs/deploiement.md) (production automatique après CI verte sur `main` ; à la main : retour arrière, portail).

## Architecture cible

`apps/web` (Astro, statique, FR/EN) · `apps/api` (PHP : `contact.php` et `tools.php`, les outils serveur rapport SEO et vérificateur de sitemap, avec la couche `Net/` protégée contre la SSRF, voir ADR 0007) · `apps/portal` (Symfony, espace client) · `packages/ui` (tokens CSS, composants) · `packages/tools-core` (logique pure des outils, TS) · `packages/config` · `packages/content-schema`. Décisions : [docs/adr/](docs/adr/).

## Conventions

- **Commits** : Conventional Commits (`type(portée): sujet`, en français), vérifiés par le hook `commit-msg`. Atomiques : un commit, un changement cohérent.
- **Git : push direct sur `main`, pas de PR, pas de préproduction.** Chaque push sur `main` part en production dès que la CI est verte (workflow `Déploiement`). Commits atomiques et fréquents, un `git push origin main` après chaque étape cohérente et terminée. Chaque commit laisse le site fonctionnel ; une fonctionnalité inachevée reste masquée (pas d'entrée dans le registre, pas de lien).
- **Avant chaque push** (il n'y a pas de filet en aval) : `pnpm verify` (s'arrête au premier échec ; ne jamais se fier à un filtre de sortie, seulement au code de retour), qui couvre `pnpm format:check` ; lint, typecheck, tests et e2e de ce qui est touché (`pnpm --filter @grichard/web lint|check|test|build|test:e2e`) ; `composer test|cs|stan` et `php -l` sur les fichiers PHP modifiés ; `CONTRACT_DIST=apps/web/dist pnpm test:contract` ; rendu vérifié en 1440/768/375 px, au clavier, thèmes clair et sombre ; `git diff --staged` relu (aucun secret ni donnée personnelle). Une vérification échoue : on corrige avant de pousser.
- **Régression en production** : `git revert` du commit fautif et push immédiat (la CI verte relivre), puis analyse. Retour arrière d'urgence : workflow `Déploiement` à la main avec `ref` = tag `deploy-production-…` précédent. Tag `pre-refonte` : état d'avant la refonte UX/outils SEO.
- **TypeScript strict** côté JS. **PHP** : `declare(strict_types=1)`, PER-CS, PHPStan niveau max, PHPUnit.
- Prettier pour tout sauf `legacy/`. Pas de couleur écrite en dur : utiliser les tokens de `packages/ui/src/tokens.css`. Jamais de `<style>` ni de script en ligne (CSP) ; les scripts sont des fichiers externes. Pas d'attribut `style=""` écrit à la main (seule la coloration syntaxique Shiki en génère : voir ADR 0005).
- Une dépendance ajoutée doit être justifiée (poids, maintenance, sécurité, compatibilité OVH).

## Sécurité (toujours)

- Zéro secret dans le dépôt (il est public). Secrets : GitHub Secrets et `private/` hors webroot sur OVH. `.env.example` seulement.
- CSP sans `unsafe-inline` pour les scripts ; scripts en ligne autorisés uniquement par empreinte (hash).
- Entrées validées côté serveur ; requêtes SQL préparées ; mots de passe Argon2id ; cookies `HttpOnly` + `Secure` + `SameSite` ; CSRF.
- Actions GitHub épinglées par SHA, permissions minimales. Pas de `display_errors` en production.

## Accessibilité (WCAG 2.2 AA, toujours)

HTML sémantique, une seule `h1`, landmarks, lien d'évitement, focus visible, cibles ≥ 44 px, contrastes vérifiés dans les deux thèmes, `prefers-reduced-motion` respecté, formulaires avec labels et erreurs explicites. axe doit passer dans la CI.

## Ne jamais

- committer un secret, un `.env`, `contact.config.php`, une base SQLite ;
- casser ou supprimer une URL publique : tout changement d'URL exige une redirection 301 et une mise à jour du contrat (`tests/contract/contract.json`) ;
- modifier le DNS, les secrets ou les réglages GitHub (proposer les étapes manuelles à Guillaume) ;
- pousser sur `main` un état non vérifié ou cassé (push = mise en production) ;
- créer une préproduction, un sous-domaine de test ou un pipeline de staging ;
- supprimer `legacy/` sans accord de Guillaume.

## Critère de « terminé » d'une étape

Build, lint, typecheck et tests verts ; contrat des URL vert ; axe vert dans les deux thèmes ; poussé sur `main`, CI et déploiement verts, contrat vérifié en ligne ; docs et ce fichier à jour ; résumé donné à Guillaume : fait, reste, risques, vérifications de son côté.
