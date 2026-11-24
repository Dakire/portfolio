# AGENTS.md

Instructions pour les agents de code (tout outil). Version détaillée pour Claude Code : [CLAUDE.md](CLAUDE.md) ; gardez les deux synchronisés.

## Projet et contrainte d'hébergement

Monorepo de grichard.eu. Production sur OVH mutualisé : **fichiers statiques + PHP 8.5 uniquement**, accès **FTP seul** (ni SSH, ni MySQL, ni Node, ni Docker). Node et pnpm ne servent qu'au build (local, GitHub Actions). Le site en ligne est `apps/web` + `apps/api` ; l'ancien site reste dans `legacy/` (référence, à ne pas supprimer sans accord du propriétaire).

## Commandes

**Avant tout push : `pnpm verify`** (mêmes contrôles que la CI, PHP compris ; code de retour non nul = ne pas pousser).

`pnpm install` · `pnpm format:check` · `pnpm legacy:check` · `pnpm legacy:build` · `pnpm test:contract` · `pnpm audit:prod` · site : `pnpm --filter @grichard/web build|check|lint|test:e2e` · design system : `pnpm --filter @grichard/ui test` · outils : `pnpm --filter @grichard/tools-core check|test` · contrat du nouveau site : `CONTRACT_DIST=apps/web/dist pnpm test:contract` · API PHP (dans `apps/api`) : `composer install`, `composer test|cs|stan`. Portail Symfony (dans `apps/portal`) : `composer install`, `composer test|cs|stan` ; doc : docs/portail.md et docs/deploiement.md. Aide-mémoire `/cheatsheets/` : après modification d'un `apps/web/data/reference/src/*.yml`, lancer `pnpm --filter @grichard/web reference:build` et commiter les JSON générés (voir docs/reference.md). Le `.htaccess` est généré par `apps/web/scripts/lib/htaccess.mjs` (ne pas l'éditer à la main). Sitemap : `/root-access.xml` (liste d'URL, référence ; `/sitemap.xml` et `/sitemap-0.xml` en sont des copies) produit par `apps/web/scripts/postbuild.mjs`, vérifiable en ligne par `pnpm --filter @grichard/web sitemap:check` (docs/seo.md). Identité visuelle : docs/adr/0012-edition-releve.md (composition des pages, portfolio d'abord ; conventions d'interface ci-dessous), suite de docs/adr/0011-identite-atelier.md et docs/adr/0010-identite-fiche-technique.md.

## Structure cible

`apps/web` (Astro statique FR/EN), `apps/api` (PHP : formulaire de contact et outils serveur SEO/sitemap via `tools.php`, couche `Net/` anti-SSRF, ADR 0007), `apps/portal` (Symfony, espace client de test, SQLite), `apps/web/data/reference` (aide-mémoire, recherche côté client, ADR 0008), `packages/ui|tools-core|config|content-schema`, `docs/adr/` (décisions).

## Architecture du site

Menu à plat À propos · Parcours · Compétences · Réalisations · Blog · Outils · Cheatsheets (+ Contact) ; `/ressources/` reste en ligne hors du menu (ADR 0009, docs/refonte-portfolio.md). Ne jamais mentionner la ville (Laval) sur le site. Contenu du profil : `apps/web/src/data/profile.ts` ; liens vers articles/outils/cheatsheets : `data/related.ts`. Une URL renommée = entrée dans `REDIRECTS` (`scripts/lib/htaccess.mjs`) et `redirects` du contrat. Lancer aussi `pnpm test:contract` (ancien site) avant de pousser : la CI le fait.

## Règles

- **Push direct sur `main`, pas de PR, pas de préproduction** : chaque push sur `main` est livré en production automatiquement après une CI verte. Commits Conventional Commits en français, atomiques, chacun laissant le site fonctionnel (fonctionnalité inachevée masquée).
- Avant chaque push : `pnpm verify`, qui enchaîne `pnpm format:check`, lint/typecheck/tests/e2e de ce qui est touché, `composer test|cs|stan` et `php -l` pour le PHP, contrat d'URL, rendu 1440/768/375 px au clavier dans les deux thèmes, `git diff --staged` sans secret. Échec = on corrige avant de pousser. Régression en ligne = `git revert` + push.
- Pas de couleur en dur (tokens `packages/ui`), pas de `<style>` ni de script en ligne (CSP) ; pas d'attribut `style=""` écrit à la main.
- TypeScript strict ; PHP `strict_types`, PER-CS, PHPStan max, PHPUnit.
- Aucun secret dans le dépôt public ; CSP sans `unsafe-inline` pour les scripts ; SQL préparé ; Argon2id ; CSRF ; cookies `HttpOnly`/`Secure`/`SameSite`.
- WCAG 2.2 AA : sémantique, focus visible, contrastes dans les deux thèmes, mouvement réduit respecté, axe vert.
- Ne jamais casser une URL publique (redirection 301 + contrat `tests/contract/contract.json` à jour), ni ajouter de dépendance sans justification, ni introduire Node en production, ni pousser un état non vérifié sur `main`, ni créer de préproduction, ni toucher au DNS, aux secrets ou aux réglages GitHub.

## Terminé =

Build, lint, typecheck, tests, contrat d'URL et axe verts ; poussé sur `main`, déploiement vert et contrat vérifié en ligne ; documentation à jour ; résumé : fait, reste, risques, vérifications à faire par le propriétaire.

Conventions d'interface (ADR 0012 et 0016, identité « console d'ingénieur ») : la page est une `.sheet` (colonne centrée, sans marge de classeur) ; thème **clair par défaut** (sans choix mémorisé, quel que soit le système), sombre = choix explicite, **aucun bouton de thème dans l'en-tête** (réglages de lecture dans le pied de page) ; deux encres seulement, `--accent` (violet ; `--u` pour les soulignés, jamais du texte) et `--pen` (bleu acier : focus, annotations) ; liens à l'encre soulignés d'un trait fin violet ; page courante du menu et survol : même filet violet (bloc « Survol harmonisé » de `site.css`) ; coins doux de 6 à 14 px ; bandeau fixe sur une ligne dès 80 rem, jamais de couleur en dur (sauf les images de curseur de `packages/ui/src/cursor.css`) ; vocabulaire de `components.css` : `.rubric`, `.ledger-row`, `.ticket`, `.note`, `.stamp` (seul endroit où les capitales sont admises), `.band` (bande d'encre inversée qui redéfinit les jetons), `.card`, `.field`, `.table`, `.chip`, `.alert`, `.btn` ; pas d'ombres (sauf palette et modales) ni de blobs ; références dérivées de données existantes (`lib/ticket.ts` : `GR-Rxx`, `AAAAMMJJ-RUB`), rien d'inventé ; curseur du site actif par défaut (flèche et main Windows classiques en violet du site, sans bulle ni JavaScript de suivi, coupé par le pied de page ou `cursor off`) ; page suivante pré-rendue au survol pour que le curseur natif ne revienne pas entre deux pages (`public/speculation-rules.json` via l'en-tête `Speculation-Rules` de `htaccess.mjs`, `data-no-prerender` pour exclure un lien, aucune mesure d'audience avant l'affichage réel) ; réseaux sociaux en icônes seules (`SocialLinks.astro`, nom dans `aria-label`, seuls les CV portent FR/EN) ; listes en lignes de registre, cartes seulement pour les résultats de cheatsheets ; bandeau de cookies premier dans le DOM mais affiché en bas par CSS (`order`, `sticky`), jamais de rembourrage sur `body` ; pas de `<title>` ni de `style=""` dans les SVG de page ; le formulaire de contact est hydraté à l'approche de l'écran (les tests e2e défilent jusqu'à lui) ; missions des expériences = exemples, pas liste exhaustive ; ne pas lier le dépôt privé `MSG-EML-To-PDF-With-Attachments` avant qu'il soit public ; après toute modification de l'avatar, régénérer `favicon.svg`, `favicon.ico`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` et `apple-touch-icon.png`. Le bas de `.page-hero` fournit l'espace avant le contenu : vérifier les espacements en 1440 et 375 px, deux thèmes.

Cheatsheets : JSON générés commités (`pnpm --filter @grichard/web reference:build` après toute modification de source YAML, de `glossaire*.yml` ou d'exemples) ; GAM : exemples écrits à la main dans `data/reference/exemples/gam-extra*.yml`, le reste généré par `scripts/reference/auto-examples.mjs` ; scripts PowerShell M365 non exécutés sur un tenant réel. Le déploiement ne sauvegarde plus le site (git et tags suffisent). Pièges Windows : `composer` hors du `PATH` de Git Bash (passer `COMPOSER_BIN`), serveur `astro dev`/`preview` oublié qui bloque `pnpm verify`, sujet de commit sans parenthèses supplémentaires.
