# CLAUDE.md

Contexte pour Claude Code. Le même contenu, formulé pour d'autres agents, est dans [AGENTS.md](AGENTS.md) : gardez les deux fichiers synchronisés.

## Projet

Monorepo de **grichard.eu** (portfolio, blog, outils en ligne, espace client de test). Refonte en cours sur `refonte/monorepo` ; le site actuellement en ligne vit dans `legacy/` comme référence.

## Contrainte non négociable : production = fichiers statiques + PHP 8.5

Hébergement OVH « hosting-free », **accès FTP uniquement** (pas de SSH, pas de MySQL, pas de multisite, pas de Node, pas de daemon, pas de Docker).
Node et pnpm n'existent qu'au **build** (local et GitHub Actions). Ce qui est déployé : HTML/CSS/JS/PDF statiques, `.htaccess`, PHP avec son `vendor/` construit en CI. Base de données du portail : SQLite (fichier hors webroot).
Ne jamais introduire de dépendance d'exécution Node, ni d'appel à un service nécessitant un serveur applicatif.

## Commandes (racine)

| Besoin                            | Commande                                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Installer                         | `pnpm install` (installe aussi les hooks)                                                                                     |
| Formater / vérifier               | `pnpm format` / `pnpm format:check`                                                                                           |
| Site actuel : build               | `pnpm legacy:build`                                                                                                           |
| Site actuel : lint+tests+e2e      | `pnpm legacy:check`                                                                                                           |
| Contrat des 70 URL publiques      | `pnpm test:contract` (après un build complet)                                                                                 |
| Contrat sur le site en ligne      | `CONTRACT_BASE_URL=https://grichard.eu pnpm test:contract`                                                                    |
| Audit des dépendances             | `pnpm audit:prod`                                                                                                             |
| Site (Astro) : dev                | `pnpm --filter @grichard/web dev` (page de style : `/design/`)                                                                |
| Site : build / types / lint       | `pnpm --filter @grichard/web build` / `check` / `lint`                                                                        |
| Site : e2e + axe                  | `pnpm --filter @grichard/web test:e2e`                                                                                        |
| Design system : tests             | `pnpm --filter @grichard/ui test`                                                                                             |
| API PHP : installer               | `cd apps/api && composer install`                                                                                             |
| API PHP : tests / style / analyse | `composer test` / `composer cs` / `composer stan` (dans `apps/api`)                                                           |
| Site : préproduction              | `SITE_BASE=/preprod/ PUBLIC_NOINDEX=1 pnpm --filter @grichard/web build` (`PREPROD_AUTH_FILE` : chemin absolu du `.htpasswd`) |

Le `.htaccess` (CSP, en-têtes, cache, redirections) est généré dans `dist/` par `apps/web/scripts/lib/htaccess.mjs` : ne pas l'écrire à la main. Les commandes de `apps/portal` seront ajoutées à sa création.

## Architecture cible

`apps/web` (Astro, statique, FR/EN) · `apps/api` (PHP, contact) · `apps/portal` (Symfony, espace client) · `packages/ui` (tokens CSS, composants) · `packages/tools-core` (logique pure des outils, TS) · `packages/config` · `packages/content-schema`. Décisions : [docs/adr/](docs/adr/).

## Conventions

- **Commits** : Conventional Commits (`type(portée): sujet`, en français), vérifiés par le hook `commit-msg`. Atomiques : un commit, un changement cohérent.
- **Branches** : une branche et une PR par phase vers `refonte/monorepo`. `main` ne reçoit la refonte qu'à la bascule finale validée par Guillaume.
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
- modifier le DNS ou les secrets (proposer les étapes manuelles à Guillaume) ;
- déclencher un déploiement en production : préparer le workflow, Guillaume le lance ;
- supprimer `legacy/` avant la bascule validée ;
- pousser sur `main` pendant la refonte (la règle « commit et push à chaque modif » vaut hors refonte).

## Critère de « terminé » d'une phase

Build, lint, typecheck et tests verts ; contrat des URL vert ; axe vert dans les deux thèmes ; docs et ce fichier à jour ; résumé donné à Guillaume : fait, reste, risques, vérifications de son côté.
