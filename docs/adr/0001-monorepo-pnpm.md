# ADR 0001 : monorepo pnpm, sans Turborepo

**Statut** : accepté (2026-10-08)

**Contexte.** Plusieurs applications (site, API PHP, portail) et des paquets partagés, une seule CI. Une seule application JS se construit pour l'instant.

**Décision.** Workspaces pnpm ; Composer propre à chaque application PHP ; hooks Lefthook. Pas de Turborepo ni de Nx : le cache de tâches ne rapporte rien tant qu'il n'y a pas plusieurs builds JS à orchestrer (ajout possible plus tard sans changer la structure).

**Conséquences.** Installation stricte (pas de dépendances fantômes). Le site actuel est un membre du workspace (`legacy`) le temps de la migration.
