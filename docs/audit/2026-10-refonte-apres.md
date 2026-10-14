# Audit après la refonte portfolio (14 octobre 2026)

Même protocole que l'[audit de départ](../refonte-portfolio.md#13-scores-de-départ-mesurés-le-14-octobre-2026) : build local servi en HTTP, Lighthouse 13.5 avec `chrome-headless-shell`, axe-core WCAG 2.2 A/AA, 1440 / 768 / 375 px, thèmes clair et sombre.

## Lighthouse (mobile / desktop : Perf. / Access. / Bonnes prat. / SEO)

| Page                        | Avant (mobile, desktop) | Après mobile         | Après desktop         | CLS desktop avant → après |
| --------------------------- | ----------------------- | -------------------- | --------------------- | ------------------------- |
| `/`                         | 96 / 98                 | 96 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0,085 → **0,007**         |
| `/en/`                      | n. m.                   | 96 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | → 0,005                   |
| `/parcours/` (nouvelle)     | n. a.                   | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0,003                     |
| `/competences/`             | n. m.                   | 98 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0,005                     |
| `/projets/`                 | 98 / 100                | 98 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0,017 → 0,008             |
| `/projets/homelab-proxmox/` | n. a.                   | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0,005                     |
| `/ressources/` (nouvelle)   | n. a.                   | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0,018                     |
| `/contact/`                 | 95 / 100                | 93 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0,004                     |

Notes :

- Le décalage de mise en page de l'accueil (0,085 en local, déjà présent avant la refonte) venait du bouton « Désactiver le terminal », révélé par le script : sa place est désormais réservée.
- `/contact/` mobile : 95 → 93, écart lié à la variabilité du simulateur (Turnstile, page inchangée) ; à revérifier en ligne.
- « n. m. » : non mesuré au départ.

## axe-core et mise en page

16 pages (accueil FR/EN, parcours, compétences, réalisations, deux réalisations, ressources, blog, outils, cheatsheets, contact, pages anglaises) × 3 largeurs × 2 thèmes = **96 combinaisons, 0 violation**, une seule `h1` par page, aucun défilement horizontal. Détail : [2026-10-refonte-apres-axe.json](2026-10-refonte-apres-axe.json). La CI exécute en plus axe sur 55 pages dans les deux thèmes.

## Hauteur de page

| Page    | Desktop avant → après    | Mobile avant → après     |
| ------- | ------------------------ | ------------------------ |
| Accueil | 5 170 → 3 953 px (−24 %) | 9 789 → 7 275 px (−26 %) |

## Captures

Avant : [captures/refonte-avant/](captures/refonte-avant/). Après : [captures/refonte-apres/](captures/refonte-apres/).
