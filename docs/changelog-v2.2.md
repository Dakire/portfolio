# Changelog v2.2

Branche `v2.2-preprod` (depuis `main` 125a0dd). Rien n'est poussé ni déployé. Voir [audit-v2.2.md](audit-v2.2.md), [seo-indexation-v2.2.md](seo-indexation-v2.2.md) et [seo-strategie-v2.2.md](seo-strategie-v2.2.md).

## Phase 1 : audit (terminée)

- Création de la branche, build local vérifié (363 pages).
- `docs/audit-v2.2.md`, `docs/da-preview/` (direction « Carnet d'exploitation », validée par Guillaume).

## Phase 2 : corrections (terminée, sauf points reportés)

**SEO / indexation**

- `/ai-catalog.json` servi à la racine en 200 `application/json` (copie de `/.well-known/`, faite au postbuild), avec test, entrée au contrat d'URL et contrôle de déploiement.
- `robots.txt` : robots d'entraînement IA refusés (GPTBot, Google-Extended, ClaudeBot, anthropic-ai, Claude-Web, CCBot, Applebot-Extended, Bytespider, Meta-ExternalAgent, cohere-ai) ; recherche et assistants autorisés. Décision de Guillaume.
- Titres : limite ramenée de 62 à 60 caractères (suffixe de marque retiré au-delà) ; 11 titres corrigés (4 `seoTitle` ajoutés, 1 titre de catégorie raccourci, 6 par la règle). 0 titre indexable de plus de 60 caractères.
- Convertisseur d'unités : titre, H1 et description alignés sur « Go en Gio / GB to GiB » (requêtes constatées dans la Search Console). Slugs inchangés.
- Calculateur réseau : lien vers l'article masque/CIDR (il n'en avait aucun).
- Nouvel article FR + EN sur le découpage d'un fichier ICS, relié depuis les outils ICS. La limite de 1 Mo de Google Agenda y est citée avec sa source et la réserve qu'elle est ancienne.

**Code**

- Astro 7.4.13 et intégrations (`@astrojs/{preact,sitemap,markdown-remark,check}`) : failles corrigées ; reste 1 alerte faible (`fast-xml-parser`, via `@astrojs/rss`).
- Analyseur d'en-têtes e-mail : 84,5 → 43,0 Ko gzip (il n'importe plus le registre des 12 outils).
- CSS : deux règles masquées supprimées (`.page-hero`, `.section-head`), sans changement visuel ; composant `BandEdge` retiré (aucune référence).

**Reporté, avec raison** : C2 (textes FR/EN par îlot : refonte des fichiers de 12 outils pour un gain limité hors DNS) ; 404 canonical, redirections `:443` et query string (constats sans effet, voir l'audit) ; `SkillCards` conservé (documenté dans `CLAUDE.md`).

## Phase 3 : identité visuelle (en cours, STOP : captures à valider)

- Cartes colorées : rayon de 28 px → 20 px (token `--radius-card`).
- Articles : grands chiffres de section remplacés par un repère « § n » en police mono.
- Articles : champ optionnel `severity` (`critical`, `warning`, `fixed`) et marqueur symbole + mot en tête, avec les couleurs `--danger`, `--warn`, `--ok` déjà testées en contraste. Aucun article existant ne l'utilise.
- Les tokens de couleur n'ont pas changé : la palette proposée était déjà quasi identique à l'existante.
- Vérifié : 0 débordement horizontal sur 252 contrôles (14 pages, 9 largeurs de 320 à 1920 px, 2 thèmes) ; 258 tests e2e et axe, 1 713 tests unitaires, 131 contrôles du contrat : verts.
- Captures avant/après (84 + 84, 3 largeurs, 2 thèmes) dans `docs/screenshots/`, **ignorées par git** (39 Mo, dépôt public).
- Pas encore fait : refonte du tableau de bord d'accueil, schémas au trait par article, composant repliable commun des outils.

## Dépendances

Mises à jour : `astro` 7.3.8 → 7.4.13, `@astrojs/preact` 6.0.6 → 6.1.6, `@astrojs/sitemap` 3.7.4 → 3.7.6, `@astrojs/markdown-remark` 7.3.2 → 7.3.10, `@astrojs/check` 0.9.10 → 0.9.12. Ajoutées ou supprimées : aucune.
