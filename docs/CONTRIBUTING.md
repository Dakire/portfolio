# Guide de contribution

1. `pnpm install` (Node ≥ 22 ; installe les hooks Git).
2. Une branche par sujet, une PR par phase vers `refonte/monorepo`.
3. Commits `type(portée): sujet` (hook `commit-msg`). Types : feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
4. Avant la PR : `pnpm format:check`, puis lint et tests de l'app touchée ; `pnpm test:contract` après un build.
5. Une URL publique modifiée = redirection 301 + mise à jour de `tests/contract/contract.json`.
6. Une dépendance ajoutée = une phrase de justification dans la PR (poids, maintenance, sécurité, compatibilité OVH).
7. Une décision structurante = une ADR dans `docs/adr/`.

Règles de sécurité, d'accessibilité et interdits : [CLAUDE.md](../CLAUDE.md).
