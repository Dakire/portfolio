# Guide de contribution

1. `pnpm install` (Node ≥ 22 ; installe les hooks Git).
2. Pas de branche ni de PR : on pousse directement sur `main`, et chaque push part en production après une CI verte (voir [deploiement.md](deploiement.md)).
3. Commits `type(portée): sujet` (hook `commit-msg`). Types : feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
4. Avant chaque push : `pnpm format:check`, lint, typecheck et tests de l'app touchée, `php -l` + `composer test|cs|stan` pour le PHP, `CONTRACT_DIST=apps/web/dist pnpm test:contract` après un build, rendu vérifié (1440/768/375 px, clavier, deux thèmes), `git diff --staged` sans secret. Rien de cassé ne part sur `main`.
5. Une URL publique modifiée = redirection 301 + mise à jour de `tests/contract/contract.json`.
6. Une dépendance ajoutée = une phrase de justification dans le message de commit (poids, maintenance, sécurité, compatibilité OVH).
7. Une décision structurante = une ADR dans `docs/adr/`.

Règles de sécurité, d'accessibilité et interdits : [CLAUDE.md](../CLAUDE.md).
