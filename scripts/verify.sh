#!/usr/bin/env bash
# Vérification locale avant push (push sur main = mise en production) : les mêmes contrôles que la CI, arrêt au premier échec.
#   pnpm verify            tout (site, design system, outils, PHP, contrat, scripts de déploiement)
#   pnpm verify --no-e2e   sans les tests navigateur (plus rapide, à réserver aux changements PHP ou de documentation)
# PHP : `php` doit être dans le PATH ; Composer est pris dans COMPOSER_BIN (par défaut « composer » ; la variable COMPOSER est réservée par Composer).
set -euo pipefail
cd "$(dirname "$0")/.."

e2e=true
[ "${1:-}" = "--no-e2e" ] && e2e=false
export PUBLIC_TURNSTILE_SITE_KEY="${PUBLIC_TURNSTILE_SITE_KEY:-1x00000000000000000000AA}" # clé de test Cloudflare (publique)

step() { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }

step 'Formatage'
pnpm -s format:check

step 'Design system et logique des outils'
pnpm -s --filter @grichard/ui test
pnpm -s --filter @grichard/tools-core check
pnpm -s --filter @grichard/tools-core lint
pnpm -s --filter @grichard/tools-core test

step 'Site : types et lint'
pnpm -s --filter @grichard/web check
pnpm -s --filter @grichard/web lint

if $e2e; then
  step 'Site : build, e2e et axe (deux thèmes)'
  pnpm -s --filter @grichard/web test:e2e
else
  step 'Site : build'
  pnpm -s --filter @grichard/web build
fi

step 'Site : intégrité du build et contrat des URL'
pnpm -s --filter @grichard/web test
CONTRACT_DIST=apps/web/dist pnpm -s test:contract

step 'Scripts de déploiement'
node --test "scripts/deploy/*.test.mjs"
for f in scripts/deploy/*.sh; do bash -n "$f"; done

if command -v php >/dev/null 2>&1; then
  step 'API PHP : syntaxe, style, analyse statique, tests'
  composer="${COMPOSER_BIN:-composer}"
  for f in $(git ls-files 'apps/api/*.php'); do php -l "$f" >/dev/null; done
  (cd apps/api && $composer cs && $composer stan && $composer test)
else
  printf '\n\033[33m! PHP absent : contrôles PHP non faits (la CI les fera, mais ne poussez pas de PHP sans eux).\033[0m\n'
fi

printf '\n\033[32m✔ Tout est vert : vous pouvez pousser sur main.\033[0m\n'
