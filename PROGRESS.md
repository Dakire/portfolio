# PROGRESS

## 24 novembre 2026 : optimisation, navigation sans rechargement, boutique et espace client

### Fait (poussé sur `main`)

| Sujet                   | Changement                                                                                                                                                                                                                                                                     | Commits              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| Audit du site           | SEO, GEO et performance déjà au niveau (392 pages contrôlées) ; jetons de couleur inutilisés retirés (`--tone-*`, `--signal*`…), dont un `--tone-danger` violet en thème clair                                                                                                 | `0655dec`            |
| Curseur entre les pages | Navigation sans rechargement (`ClientRouter` d'Astro) : le curseur Windows ne réapparaît plus. Scripts du `body` en `data-astro-rerun`, écouteurs globaux coupés à `astro:before-swap`, `theme.js` repose thème et curseur à `astro:after-swap`. Pré-rendu au survol abandonné | `ed26e9f`, `904f3db` |
| Sécurité                | `twig/twig` passé en 3.31.1 (failles du bac à sable publiées le jour même ; elles bloquaient toute livraison)                                                                                                                                                                  | `9df7cf5`            |
| Outillage local         | Composer installé, `pdo_sqlite` activé : `pnpm verify` contrôle aussi l'API, le portail et `packages/licence`                                                                                                                                                                  | `ba346ce`, `1e4b605` |
| Décision boutique       | ADR 0017 (Paddle comme Merchant of Record, licences Ed25519 vérifiées hors ligne, webhooks, aucun serveur en plus) ; feuille de route [docs/boutique.md](docs/boutique.md)                                                                                                     | `8a84d4a`            |
| Espace client en ligne  | Portail livré sous `/espace/`, apparence du site (copie générée de `packages/ui`, thème et curseur suivis), aperçu privé de la boutique `/espace/boutique`                                                                                                                     | `c650ac3`, `1eb2122` |
| Lot 1 : vitrine         | `/boutique/` et `/en/shop/` : 3 produits, tarifs, CGV, remboursement 30 jours, licence ; masqués (`SHOP_OPEN = false`, noindex, hors sitemap)                                                                                                                                  | `a1d221a`            |
| Lots 2 et 3 : portail   | Inscription, adresse confirmée, mot de passe oublié, double authentification, export et suppression RGPD ; licences signées, notifications Paddle, API des produits, téléchargements, administration des licences ; confidentialité du site complétée                          | `a0bebbd`            |
| Lot 4 : produits        | `packages/licence` : vérification JS (extensions, Worker Slack) et PHP (modules PrestaShop), testée contre les jetons du portail ; guide [docs/licences.md](docs/licences.md)                                                                                                  | `1e4b605`            |
| Migrations              | Appliquées automatiquement à la première requête d'une livraison (une migration de `app_user` aurait sinon bloqué la connexion)                                                                                                                                                | `9a576a8`            |
| Menu                    | Lien « Espace client » dans l'en-tête (icône sur grand écran, libellé sur mobile)                                                                                                                                                                                              | `2508028`            |

Vérifications à chaque étape : `pnpm verify` (e2e et axe dans les deux thèmes, contrats d'URL, PHP), rendu en 1440 et 375 px, contrat vérifié en ligne après les livraisons du site.

### En cours

- Livraison du portail avec les lots 2 et 3 (workflow `Déploiement`, cible `portal`) : tant qu'elle n'est pas terminée, `/espace/inscription` et `/espace/api/…` répondent 404. Après la livraison : se connecter (les migrations s'appliquent seules), vérifier `/espace/compte` et `/espace/licences`.

### Reste à faire

**Guillaume**

- Créer la micro-entreprise début janvier 2027 (gratuit, formalites.entreprise.gouv.fr) ; ouvrir Abby ou Tiime (formule gratuite).
- Générer la clé de signature des licences et l'ajouter à `private/portal.php` (`licence_key`, commande dans [docs/licences.md](docs/licences.md)) ; la sauvegarder dans le gestionnaire de mots de passe.
- Compte Paddle sandbox : produits et prix, destination de notification `https://grichard.eu/espace/webhooks/paddle` et son secret (`paddle_webhook_secret`).
- Tester la délivrabilité des e-mails du portail : créer un compte avec une adresse personnelle et vérifier `spf=pass` et `dmarc=pass` (DMARC du domaine en `p=reject`).
- Relire les fiches produit (fonctions marquées « à préciser »), CGV, remboursement et licence ; ajouter le SIRET dès l'immatriculation.
- Intégrer `packages/licence` dans les produits (hors de ce dépôt) et passer le bot Slack de Stripe à Paddle.

**Dans le dépôt, une fois Paddle configuré**

- Prix Paddle dans `apps/portal/config/paddle_prices.php`.
- Boutons d'achat (Paddle.js en surimpression, `customData.user_id`) sur les fiches et dans l'espace client ; domaines de Paddle dans la CSP (`htaccess.mjs`, `.htaccess` du portail).
- Achat de bout en bout en sandbox (licence, renouvellement, remboursement).
- Ouverture : `SHOP_OPEN = true`, préfixes retirés d'`EXCLUDED`, lien « Boutique » au menu, contrat d'URL et sitemap ; aperçu privé `/espace/boutique` retiré ou réservé à l'administrateur.

**Questions ouvertes** : apps Shopify (App Store ou sur mesure), canal du support client, rappel de renouvellement des abonnements annuels par Paddle (annoncé par les CGV, à vérifier).

## État

- Phase 1 (audit) : **faite** → `THEME-MERGE-AUDIT.md`.
- Phase 2 (maquette) : **faite**, `mockups/index.html`, en attente de validation.
- Phase 3 : lots 1 à 3 faits ; lots 4-10 à faire.
- Phase 4 : à faire.

## Décisions

- Identité « carnet » (ADR 0014/0015) remplacée par un thème sombre sobre ; clair conservé en variante explicite. ADR 0016 à écrire au lot 1.
- Recherche globale : Pagefind (remplace `search.js` et `/search-index.json` ; cheatsheets gardent MiniSearch).
- Références : inspiration seulement, aucun code copié (Astro Developer Theme sans licence ; Astrofy et terminal-portfolio MIT, non portés).
- Branche de travail : push direct sur `main` après `pnpm verify` (règle du dépôt).

## Points ouverts / données manquantes

- Statut de disponibilité réel : aucune donnée → pas d'indicateur tant que Guillaume ne le fournit pas.
- Aperçus (captures) des projets, dépôts GitHub publics par projet : non fournis.
- Menu : « Expériences » du brief = `/parcours/` existant ? À confirmer en phase 2.
- Police sans (Geist, repli Inter) : disponibilité fontsource à vérifier.
- Mise à jour de CLAUDE.md et AGENTS.md (synchronisés) au lot 1.

## Lot 1 (tokens et composants de base) : fait, non poussé

- `tokens.css` réécrit (sombre défaut, `data-theme='light'`), Geist remplace Newsreader (fonts, préchargement, postbuild OG), `theme.js` défaut sombre, `.sheet` sans marge/perforations, liens soulignés droits, `.stamp` en badge, cartes sans ombre. ADR 0016, CLAUDE.md et AGENTS.md à jour.
- Vérifié : `astro check` 0 erreur, build OK (clé Turnstile factice en local), vitest web 1739 verts, tests contraste ui 19 verts. e2e/axe non relancés (à faire avant push via `pnpm verify`).
- Reste du carnet à retirer : `cursor.css` (lot 2/10), références `GR-Rxx`, bandeau « carnet » de l'en-tête, OG cards (palette claire, lot 10), pages `/design/`.
- Note : `dist-preprod` résiduel, à supprimer sur accord.

## Lot 2 (layout, header, footer, navigation) : fait, non poussé

- En-tête : filet fin, nav à fond de survol et page courante soulignée en bleu acier (plus de masque SVG au stylo), boutons à coins doux, bouton primaire en accent ambre, intitulé « technicien informatique » (plus « carnet d'interventions »). Pied de page : filets fins. Menu mobile et sous-menu Outils restylés. Vérifié en 1440 et 375 px (captures), e2e 277 verts, vitest 1739 verts.
- Lien `>_` vers `/terminal/` volontairement absent : la page n'existe qu'au lot 6 (fonctionnalité inachevée = masquée).
- Reste carnet : accueil (« Fiche d'identification », « carnet »), `.rubric` à double filet, `GR-Rxx`, `cursor.css` → lots 3 à 10.

## Lot 3 (accueil) : fait, non poussé

- Accent changé à la demande de Guillaume : **violet** (`#a78bfa` sombre, `#6d3fd6` clair), curseur compris ; ni orange ni vert. ADR 0016, CLAUDE.md, AGENTS.md à jour.
- Accueil refait selon 60 % (base sombre, filets fins, grille de compétences, cartes de projets) / 25 % (sections Astrofy : présentation, compétences, technologies, projets, frise d'expériences, derniers articles) / 15 % (aperçu `ls competences/` en mono dans le hero, curseur clignotant, section terminal).
- Provisoire : le terminal interactif reste sur l'accueil (ancre `#terminal`) jusqu'au lot 6 ; le prompt du hero y renvoie, puis renverra vers `/terminal/`.
- Rubriques : double filet remplacé par un filet fin (accueil, blog, pages, outils). Références `GR-Rxx` retirées de l'accueil.
- Reste carnet : `cursor.css` à garder (violet) ou retirer, `lib/ticket.ts`, réglage « carnet » du pied de page, OG cards.

## Lot 4 (données centralisées) : fait, non poussé

- `src/data/catalog.ts` : catalogue typé unique (pages, projets, compétences, expériences, articles, catégories, tags, outils, cheatsheets), dérivé des données existantes. `/search-index.json` et les données du terminal (`terminal/data.ts`, désormais avec slug/description des projets, formation, tous les articles) en dépendent. vitest 1743 verts, check 0 erreur.

## Lot 5 (recherche Pagefind) : fait, non poussé

- Pagefind 1.6 (dev), indexé au build ; palette Ctrl/Cmd+K groupée (Pages, Projets, Articles, Compétences...), surlignage, suggestions, état « aucun résultat », page `/search/?q=` (FR et EN, noindex). CSP `wasm-unsafe-eval`. Tests e2e `search.spec.ts` ; 278 e2e et 1747 vitest verts.
- Piège : un `astro preview` oublié sur le port 4321 fausse les e2e (servait un ancien dist) : l'arrêter avant de lancer.
- Les compétences et expériences sont des sections de leurs pages (résultats de niveau page, groupe selon le filtre `type`).

## Lot 6 (terminal) : fait, non poussé

- Page `/terminal/` (FR) et `/en/terminal/` ; entrée `>_ Terminal` dans le menu ; le terminal quitte l'accueil (le prompt du hero y renvoie). Contenu essentiel en HTML statique sous le terminal (compétences, projets, liens), indexable.
- Nouvelles commandes : reset, history, date, pwd, cd, education, project <nom>, blog <slug>, github, website, banner, man <cmd>, fortune ; cachées : matrix, konami (courts, interruptibles, sans animation si mouvement réduit), sudo/42/coffee existants. Arborescence virtuelle /about /skills /projects /experience /blog /contact (ls/cd/pwd/cat), prompt `guillaume@grichard.eu:~/dossier (main)$`.
- Expérience : historique en `sessionStorage`, Tab sur commandes et arguments (dossiers, projets, articles, man), suggestion « Vouliez-vous dire », casse ignorée, Ctrl+L / Ctrl+C / Ctrl+K seulement dans le champ du terminal. Registre fermé : aucun eval ni JS arbitraire.
- Vérifié : check 0 erreur, vitest 1761, e2e 281 verts (axe compris).
- Reste : test manuel mobile (clavier virtuel) au lot 10 / phase 4.

## Lot 7 (projets) : fait, non poussé

- `/projets/` : îlot Preact `src/projects/ProjectGrid.tsx` (rendu serveur, donc lisible sans JS), filtres par domaine et par technologie (12 plus fréquentes), compteur annoncé, cartes (domaine, titre, description, technologies, lien GitHub si le projet est public). Badge « perso/pro » seulement si `kind` est renseigné. Plus d'aperçu image : aucune capture fournie, rien d'inventé (point ouvert).
- Références `GR-Rxx` retirées des fiches et des listes de projets. Pages détaillées inchangées (blocs context/role/steps/result masqués tant qu'ils sont vides). Tests `projects.spec.ts`.

## Lot 8 (blog) : fait, non poussé

- Déjà en place : index, catégories, tags, temps de lecture, date, articles associés, sommaire. Ajouts : `public/js/post.js` (barre de progression, bouton Copier sur chaque bloc de code, « Copier le lien », partage natif Web Share si disponible, sans service tiers), articles voisins (plus ancien / plus récent), libellé « Fiche n° » retiré. Test `blog.spec.ts`.
- Pas de pagination : l'index est groupé par mois (37 articles) ; à ajouter si le blog dépasse ~60 articles.

## Lot 9 (pages secondaires) : fait, non poussé

- Vocabulaire « carnet » retiré des textes visibles : « Journal de bord » devient « Expériences » (Parcours), 404 « Page introuvable », réglage de curseur « violet / système » (FR et EN). Les pages À propos, Compétences, Contact, Outils, Cheatsheets, légales héritent des nouveaux jetons et composants (axe vert dans les deux thèmes).
- Reste lot 10 : responsive 320 à 1920, finitions (cursor.css, OG cards, `/design/`), puis phase 4.

## Lot 10 (finitions) : fait, non poussé

- Cartes de partage (OG) sombres et violettes ; test de défilement horizontal étendu à 320, 390, 768, 1280 et 1920 px sur accueil, cheatsheets, article, terminal, projets, recherche.

## Rapport final (phase 4)

- Build, `astro check` (0 erreur), oxlint, vitest web (1761), tests de contraste ui (19), e2e Playwright (284, axe WCAG 2.2 AA dans les deux thèmes), contrat des URL (133), `pnpm audit:prod` : verts.
- Aucune erreur console ni requête en échec sur 10 pages en 390 px (FR et EN).
- Recherche : palette Pagefind testée (ouverture clavier, groupes, accents/casse, aucun résultat, `/search/?q=`). Terminal : commandes couvertes par 1761 tests unitaires et e2e (Ctrl+C/K/L, historique de session, Tab, easter eggs).
- NON fait ou non vérifié : Lighthouse (outil non installé ici ; objectif ≥ 95 à mesurer en ligne), `pnpm verify` complet (PHP, `composer test|cs|stan` non relancés : aucun fichier PHP touché), vérification visuelle manuelle du thème clair et du clavier virtuel mobile, test des liens sortants.
- Données à fournir par Guillaume : disponibilité réelle (aucun indicateur affiché), captures d'aperçu des projets, catégorie « perso/pro » des projets (`kind`), dépôt public de chaque projet.
- Décisions à confirmer : accent violet (choisi par Guillaume), suppression de `dist-preprod` (préproduction interdite), suppression éventuelle de `cursor.css` (gardé, en violet).
- Risque avant push (= production) : CSP élargie (`wasm-unsafe-eval` pour Pagefind) ; `pagefind/` ajoute ~1 Mo en FTP ; nouvelles URL `/terminal/`, `/search/` (FR et EN) à ajouter au contrat si souhaité ; les pages `.htaccess` de redirection n'ont pas changé.

## Suite (après le rapport final)

- Dossiers `design-proposals/`, `mockups/` et `graphify-out/` supprimés (demande de Guillaume).
- Projet ajouté depuis le dépôt public Dakire/StreamDeck (README du dépôt) : StreamDak, avec sa capture d'écran réelle (`public/img/projets/streamdak.png`). Les autres projets sans capture affichent un aperçu généré (fenêtre de terminal faite des données du projet). Dépôts publics déjà liés : portfolio, MineralContest, JetTracker, Star-Seeker, Nurikabe ; les projets professionnels et `MSG-EML-To-PDF-With-Attachments` (privé) n'ont pas de lien.
- Fil d'Ariane ajouté partout où il manquait (pages légales, blog, catégories, tags, hub des outils, recherche) ; test `dist.test.ts` pour que cela ne se reproduise pas.
- Non vérifié : `composer test|cs|stan` (composer absent de cette machine, aucun fichier PHP touché).
