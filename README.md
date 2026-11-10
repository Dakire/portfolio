# grichard.eu

Monorepo de [grichard.eu](https://grichard.eu) : portfolio, blog, outils en ligne et espace client de test de Guillaume Richard.

## Contrainte d'hébergement

Production OVH mutualisé : **fichiers statiques + PHP 8.5**, accès FTP/SFTP uniquement. Node et pnpm n'existent qu'au build (local et GitHub Actions). Voir [ADR 0002](docs/adr/0002-production-statique-et-php.md).

## Structure

```
apps/web        Site public (Astro statique, FR/EN) : pages, blog, outils (îlots Preact), cheatsheets /cheatsheets/
apps/api        PHP sans dépendance d'exécution : contact.php (formulaire) et tools.php (rapport SEO,
                vérificateur de sitemap), couche Net/ protégée contre la SSRF
apps/portal     Espace client de test (Symfony, SQLite)
packages/ui     Design system : tokens CSS, polices auto-hébergées, thèmes clair/sombre, composants
packages/tools-core  Logique pure des outils (TypeScript, testée)
packages/config Configuration partagée
legacy/         Ancien site (React + Vite), conservé comme référence
tests/contract  Les URL publiques à ne jamais casser
docs/           ADR, déploiement, contribution, checklist, SEO, audit visuel, ton éditorial
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

Dix outils s'exécutent entièrement dans le navigateur (DNS, ICS, réseau, JSON, encodage, mots de passe, unités…). Deux passent par le serveur, car ils lisent un site tiers : le **rapport SEO** (`/outils/seo/`, export PDF et JSON) et le **vérificateur de sitemap** (`/outils/sitemap/`). Leur conception et leurs protections (SSRF, CSRF, Turnstile, quotas, aucune donnée conservée) sont décrites dans l'[ADR 0007](docs/adr/0007-outils-serveur-php-safehttpclient.md).

L'outil d'unités (`/outils/convertisseur-unites/`) est centré sur le **temps de téléchargement** (taille et débit vers durée) et propose la **bande passante nécessaire** (taille et durée vers débit), puis les tailles (Go/Gio) et les bases numériques ; il est en tête de la page Outils et de l'accueil. Le calcul est dans `packages/tools-core/src/units.ts` (testé).

## Cheatsheets (aide-mémoire)

Neuf références, chacune en **français et en anglais** (`/cheatsheets/…` et `/en/cheatsheets/…`) : GAM, PowerShell Microsoft 365, Windows 11, Active Directory, réseau, Linux/Proxmox, Git/Claude Code, événements Windows, touches BIOS/UEFI. Recherche instantanée 100 % navigateur (MiniSearch local, index JSON statique), **tolérante** : mots vides ignorés, **glossaire français → commandes** (« deleguer » trouve `gam … delegate to`, « taille des boîtes » trouve `Get-MailboxStatistics`), résultats approchants signalés quand peu de résultats exacts existent.

- **GAM** (1 768 entrées issues du wiki) : **chaque commande a un exemple** (écrit à la main pour environ 220 commandes courantes dans `data/reference/exemples/gam*.yml`, construit depuis la syntaxe du wiki pour les autres par `scripts/reference/auto-examples.mjs`) et une description française et anglaise.
- **PowerShell Microsoft 365** (73 entrées) : Exchange Online, Graph, Entra ID, Teams, SharePoint, Intune, Defender, et une catégorie **Scripts prêts à l'emploi** (export des boîtes Exchange avec prénom, nom, adresse, taille, alias et transferts ; délégations ; comptes inactifs ; utilisateurs sans MFA ; procédure de départ…).

Sources éditables dans `apps/web/data/reference/src/*.yml`, JSON générés et commités dans `apps/web/public/data/reference/`. Régénération : `pnpm --filter @grichard/web reference:build` (GAM depuis le wiki : `reference:gam`). Guide d'ajout, exemples, versions anglaises et glossaire : [docs/reference.md](docs/reference.md) ; décision : [ADR 0008](docs/adr/0008-references-recherche-cote-client.md).

## Blog, brouillons et SEO

Articles en Markdown dans `apps/web/src/content/blog/` (français) et `…/en/` (anglais, `translationOf`). Rubriques : messagerie, DNS, migration, sécurité, poste de travail, actualités, IA et **Web et SEO** (rapport d'audit SEO, erreurs de sitemap). Le champ `draft: true` exclut un article de tout : page, liens, sitemap, flux et image de partage ; un test interdit de publier un article qui contient encore un marqueur « À COMPLÉTER ». Titres et descriptions sont limités à 62 et 160 caractères (tests automatiques). **Le sitemap de référence est `/root-access.xml`** (`/sitemap.xml` et `/sitemap-0.xml` en restent des copies). Audit page par page, plan des requêtes (avec les données Search Console du 10 novembre 2026) et suivi : [docs/seo.md](docs/seo.md), [docs/seo-audit.md](docs/seo-audit.md), [docs/seo-plan.md](docs/seo-plan.md) ; règles d'écriture : [docs/ton-editorial.md](docs/ton-editorial.md).

## Identité visuelle

Titres en Bricolage Grotesque, texte en Atkinson Hyperlegible Next, code en JetBrains Mono (polices auto-hébergées), thèmes clair et sombre pensés séparément, contrastes testés. Palette « encre » : noir chaud et papier, un seul accent terracotta. Sections colorées en **cartes arrondies posées sur le fond de page, en deux tons seulement** (bruns doux en sombre, sable et pêche en clair), avec quelques formes douces (blobs, vagues) et deux blobs en fond de page ; menu en liens simples soulignés à l'accent ; pas de décor en traits, pas de curseur animé. Décisions : [ADR 0013](docs/adr/0013-cartes-colorees.md) (cartes, deux tons, formes), [ADR 0012](docs/adr/0012-edition-releve.md) (structure des pages, conventions d'interface), [ADR 0011](docs/adr/0011-identite-atelier.md) et [ADR 0010](docs/adr/0010-identite-fiche-technique.md) (historique). Page de style : `/design/` en local ; audit : [docs/audit-visuel.md](docs/audit-visuel.md).

L'avatar (`apps/web/public/img/guillaume-clair.svg` et `-sombre.svg`, T-shirt plus clair en thème sombre) est un dessin à la main ; le favicon et les icônes d'application (`favicon.svg`, `favicon.ico`, `icon-*.png`, `apple-touch-icon.png`) sont régénérés depuis `favicon.svg` à chaque changement de l'avatar.

## Contenu du profil

Expériences (contrat, missions citées à titre d'exemple, compétences), formations, compétences et réalisations sont dans `apps/web/src/data/profile.ts` (français et anglais, parité vérifiée). Cinq domaines d'expertise, dans cet ordre : Support et projets IT, Réseau et systèmes, Messagerie et cloud, Développement et automatisation, Sécurité IT (la page Réalisations suit le même ordre). Guillaume n'est pas à son compte : pas de formulation « freelance » ni « mission » dans les appels à contact. Chaque réalisation a sa page ; `href` pointe vers son dépôt GitHub quand il est public (MineralContest, JetTracker, Star Seeker, Nurikabe). Le dépôt du convertisseur MSG/EML est privé pour l'instant : son `href` est à ajouter dans `profile.ts` (commentaire en place) quand il sera public. Rien n'est inventé : ce qui n'est pas renseigné n'est pas affiché.

## Déploiement

**Push direct sur `main`, pas de PR, pas de préproduction.** Chaque push sur `main` lance la CI ; si elle est verte, le workflow **Déploiement** livre automatiquement en production par FTP/SFTP (contrat des URL vérifié en ligne, tag `deploy-production-…` pour le retour arrière ; pas de sauvegarde du site : tout est dans git). On vérifie donc tout **avant** de pousser : [docs/release-checklist.md](docs/release-checklist.md). Détails, secrets et retour arrière : [docs/deploiement.md](docs/deploiement.md).

Documentation : [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md) (conventions, sécurité, accessibilité), [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md), [SECURITY.md](SECURITY.md).
