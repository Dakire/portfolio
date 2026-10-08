# grichard.eu

Monorepo de [grichard.eu](https://grichard.eu) : portfolio, blog, outils en ligne et espace client de test de Guillaume Richard.

> **Refonte en cours** (branche `refonte/monorepo`). Le site actuellement en ligne est dans [legacy/](legacy/) (voir son [README](legacy/README.md)) ; il sert de référence jusqu'à la bascule.

## Contrainte d'hébergement

Production OVH mutualisé : **fichiers statiques + PHP 8.5**, accès FTP uniquement. Node et pnpm n'existent qu'au build (local et GitHub Actions). Voir [ADR 0002](docs/adr/0002-production-statique-et-php.md).

## Structure

```
legacy/      Site actuel (React + Vite pré-rendu), conservé comme référence
apps/        web (Astro), api (PHP), portal (Symfony)      [à venir]
packages/    ui, tools-core, config, content-schema        [à venir]
tests/       contract/ : les 70 URL publiques à ne jamais casser
docs/        ADR, contribution, checklist de release
```

## Démarrage

```bash
pnpm install          # Node >= 22 ; installe aussi les hooks Git
pnpm legacy:check     # lint + tests + e2e du site actuel
pnpm legacy:build && pnpm test:contract
```

Documentation : [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md) (conventions, sécurité, accessibilité), [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md), [docs/release-checklist.md](docs/release-checklist.md), [SECURITY.md](SECURITY.md).
