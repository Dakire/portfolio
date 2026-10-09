# grichard.eu

Monorepo de [grichard.eu](https://grichard.eu) : portfolio, blog, outils en ligne et espace client de test de Guillaume Richard.

## Contrainte d'hébergement

Production OVH mutualisé : **fichiers statiques + PHP 8.5**, accès FTP/SFTP uniquement. Node et pnpm n'existent qu'au build (local et GitHub Actions). Voir [ADR 0002](docs/adr/0002-production-statique-et-php.md).

## Structure

```
apps/web        Site public (Astro statique, FR/EN) : pages, blog, outils (îlots Preact)
apps/api        PHP sans dépendance d'exécution : contact.php (formulaire) et tools.php (rapport SEO,
                vérificateur de sitemap), couche Net/ protégée contre la SSRF
apps/portal     Espace client de test (Symfony, SQLite)
packages/ui     Design system : tokens CSS, thèmes clair/sombre, composants
packages/tools-core  Logique pure des outils (TypeScript, testée)
packages/config Configuration partagée
legacy/         Ancien site (React + Vite), conservé comme référence
tests/contract  Les URL publiques à ne jamais casser
docs/           ADR, déploiement, contribution, checklist
```

## Installation et build

```bash
pnpm install                                  # Node >= 22 ; installe aussi les hooks Git
pnpm verify                                   # tous les contrôles de la CI (à lancer avant chaque push)
pnpm --filter @grichard/web dev               # site en local (page de style : /design/)
pnpm --filter @grichard/web build             # build statique dans apps/web/dist (PUBLIC_TURNSTILE_SITE_KEY requis)
pnpm --filter @grichard/web lint check test test:e2e
CONTRACT_DIST=apps/web/dist pnpm test:contract
cd apps/api && composer install && composer test && composer cs && composer stan
```

## Outils en ligne

Dix outils s'exécutent entièrement dans le navigateur (DNS, ICS, réseau, JSON, encodage…). Deux passent par le serveur, car ils lisent un site tiers : le **rapport SEO** (`/outils/seo/`) et le **vérificateur de sitemap** (`/outils/sitemap/`). Leur conception et leurs protections (SSRF, CSRF, Turnstile, quotas, aucune donnée conservée) sont décrites dans l'[ADR 0007](docs/adr/0007-outils-serveur-php-safehttpclient.md).

## Déploiement

**Push direct sur `main`, pas de PR, pas de préproduction.** Chaque push sur `main` lance la CI ; si elle est verte, le workflow **Déploiement** livre automatiquement en production par FTP/SFTP (sauvegarde préalable, contrat des URL vérifié en ligne, tag `deploy-production-…`). On vérifie donc tout **avant** de pousser : [docs/release-checklist.md](docs/release-checklist.md). Détails, secrets et retour arrière : [docs/deploiement.md](docs/deploiement.md).

Documentation : [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md) (conventions, sécurité, accessibilité), [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md), [SECURITY.md](SECURITY.md).
