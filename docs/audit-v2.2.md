# Audit v2.2 (phase 1, lecture seule)

Date : 2026-11-20. Branche `v2.2-preprod`, depuis `main` (125a0dd). Aucun fichier du site n'a été modifié pendant l'audit.

**Méthode.** Build local (`pnpm --filter @grichard/web build`, 363 pages, OK) ; trois relectures par sous-agents en lecture seule (code, SEO sur `dist/`, sécurité/perf/a11y) ; contrôles `curl` en lecture seule sur la production. Les constats d'un sous-agent que je n'ai pas recoupés sont marqués _(à confirmer)_.

**Écart avec le brief.** Le brief suppose un site plus basique que l'existant. Le dépôt utilise `pnpm` (pas `npm`), les polices sont déjà auto-hébergées, le sitemap a de vrais `lastmod`, la CSP est stricte, `robots.txt` autorise déjà les robots IA, et une identité visuelle (ADR 0013) a été livrée le 10 novembre. Beaucoup de points du brief sont donc déjà conformes (section « Déjà conforme »).

## 1. Résumé

- **Aucun P0.**
- **P1** : Astro vulnérable (≤ 7.4.4) ; 60 Ko de JS inutiles sur l'outil en-têtes e-mail ; textes FR+EN embarqués ensemble dans chaque outil ; règles CSS contradictoires (`.page-hero`, `.section-head`).
- **Indexation du blog** : aucun défaut technique trouvé (voir 3). Ce que je ne peux pas vérifier : l'indexation réelle dans Google. Voir `docs/seo-indexation-v2.2.md` (à écrire en phase 2).

## 2. Stack

| Élément                                                                 | Constat                                                                                                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Astro 7.3.8, Preact 11, `@astrojs/{preact,rss,sitemap,markdown-remark}` | Tout est importé. `lucide-preact` : 17 imports, tree-shaké.                                                                                                         |
| `minisearch` (devDependency)                                            | Aucun import dans `src/` : normal, `scripts/reference/lib.mjs` le copie vers `public/js/libs/`. Garder.                                                             |
| `astro.config.mjs`                                                      | `site` OK, `trailingSlash: 'always'`, `build.format: 'directory'`, `inlineStylesheets: 'never'`. Pas d'i18n Astro : FR à la racine, EN sous `/en/`, géré à la main. |
| `vitest`, `typescript`, `oxlint`, `@types/node`                         | Répétés dans chaque package aux mêmes versions. **P2** : catalog pnpm.                                                                                              |
| Doc                                                                     | **P2** : `CLAUDE.md` cite `packages/content-schema`, qui n'existe pas ; en-tête de `tools/registry.ts` cite un `components.ts` inexistant.                          |

## 3. SEO et indexabilité technique

Vérifié sur `dist/` (363 fichiers) et en production (`curl`, UA Googlebot).

**Déjà conforme (vérifié) :**

- 178 URL dans `/root-access.xml` : toutes en 200 **direct** en production (0 redirection), canonical = URL du sitemap = URL servie, aucune en `noindex`, aucune en majuscule, `lastmod` des articles = `dateModified`.
- 70 articles (35 FR + 35 EN) : canonical auto-référent, hreflang fr/en/x-default réciproques et uniquement entre pages traduites, un seul h1, title et description uniques, og/twitter complets, JSON-LD `BlogPosting` + `BreadcrumbList` valides, auteur et dates visibles, 561 à 1396 mots dans le HTML brut (sans JS).
- Maillage : aucun article orphelin ; 4 articles à 1 clic de l'accueil, 35 à 2 clics, 31 à 3 clics.
- Catégories : indexables, canonical propre. Tags (184 pages) : `noindex, follow`, hors sitemap.
- Slash final : `/x` répond 301 vers `/x/`, puis 200. HTTP→HTTPS et www→apex : un seul saut. URL inexistante : vrai 404. `root-access.xml` : `application/xml`.
- `robots.txt` : ne bloque pas `/_astro/` (seuls `/contact.php` et `/tools.php`), déclare le sitemap, autorise explicitement les robots de recherche **et** d'entraînement IA.
- `ai-catalog.json` : JSON valide, servi en `application/json` sous `/.well-known/ai-catalog.json`.

**Constats :**

| #   | Constat                                                                                                                                                                                                      | Priorité | Correction proposée                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | `/ai-catalog.json` (racine) renvoie un **404 HTML** en production. C'est très probablement l'URL interrogée par le validateur qui a signalé « Malformed JSON ». Rien dans le dépôt ne pointe vers la racine. | P1       | Redirection 301 `/ai-catalog.json` → `/.well-known/ai-catalog.json` dans `htaccess.mjs` + `contract.json` + test ; référencer le fichier dans `llms.txt`. Demander quelle URL le validateur appelait. |
| S2  | `/sitemap-index.xml` : 404 en production, alors que le build en génère un (`dist/sitemap-index.xml`) ; il n'est pas déployé ou est exclu.                                                                    | P2       | Décision à prendre : le déployer (copie identique) ou ne rien faire. Google n'en a pas besoin ; un outil tiers peut l'essayer.                                                                        |
| S3  | Le header `Location` des redirections contient `https://grichard.eu:443/…` (port explicite).                                                                                                                 | P2       | Corriger la règle de redirection (`%{HTTP_HOST}` sans port). Sans effet SEO, esthétique.                                                                                                              |
| S4  | Les redirections HTTP→HTTPS / www→apex perdent la query string.                                                                                                                                              | P2       | `[QSA]`.                                                                                                                                                                                              |
| S5  | `/404.html` : canonical vers elle-même et servie en 200 sur son URL directe. Protégée par `noindex`.                                                                                                         | P2       | Retirer le canonical de la 404.                                                                                                                                                                       |
| S6  | 9 titles font 61-62 caractères (> 60).                                                                                                                                                                       | P2       | Raccourcir (le schéma autorise 62).                                                                                                                                                                   |
| S7  | 68 articles sur 70 ont `dateModified` = date de publication.                                                                                                                                                 | P2       | Ne changer que lors d'une vraie révision.                                                                                                                                                             |
| S8  | 106 URL du sitemap sans `lastmod` (hors articles).                                                                                                                                                           | P2       | Volontaire (pas de date fictive). Rien à faire.                                                                                                                                                       |
| S9  | Pas de pagination du blog (35 articles sur `/blog/`).                                                                                                                                                        | P2       | À prévoir au-delà de ~50 articles (redirections et contrat d'URL requis). Pas maintenant.                                                                                                             |
| S10 | RSS : pas de `updated`, `categories` = tags (pas la catégorie), pas de `atom:link rel=self`.                                                                                                                 | P2       | Compléter.                                                                                                                                                                                            |
| S11 | JSON-LD : cohérence `Person` (`worksFor`, `sameAs`, `email`) avec le contenu visible non recoupée.                                                                                                           | P2       | Contrôler en phase 2.                                                                                                                                                                                 |

**Non vérifié :** indexation réelle (Search Console), rendu par Googlebot, schema.org validator, en-têtes `X-Robots-Tag` (aucun n'est émis en production : constaté).

## 4. Code, composants, performance

| #   | Constat                                                                                                                                                  | Priorité | Correction proposée                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | `tools/email-headers/Tool.tsx:7` importe `registry` ⇒ embarque les textes des 12 outils : ~87 Ko gzip sur la page, ~60 Ko inutiles.                      | P1       | Passer les URL des outils liés en props depuis `ToolPage.astro`.                                                                        |
| C2  | Outil DNS (et les autres) : textes FR **et** EN embarqués dans l'îlot (`text.*.js` 18 Ko gzip pour dns).                                                 | P1       | Ne passer à l'îlot que `text[lang]`.                                                                                                    |
| C3  | 12 outils en `client:load`. Seule la page contact est en `client:visible`.                                                                               | P2       | `client:visible`/`idle` seulement pour ce qui est sous le pli ; les e2e attendent l'outil au-dessus du pli. À mesurer avant de changer. |
| C4  | Poids JS gzip : accueil ~6 Ko + ~8 Ko vanille ; blog/articles 0 Ko Astro ; contact ~20 ; subnet ~20 ; json ~20 ; seo ~26 ; dns ~47 ; email-headers ~87.  | info     | Objectif après C1/C2.                                                                                                                   |
| C5  | `components/BandEdge.astro` et `SkillCards.astro` : importés nulle part.                                                                                 | P2       | Supprimer après confirmation (grep final).                                                                                              |
| C6  | `setTimeout` de `flash()` sans nettoyage (dns `Tool.tsx:112`, `CopyButton.tsx:19`, ics-compare, propagation). Les autres `useEffect` ont leur nettoyage. | P2       | Un seul hook `useFlash` avec cleanup.                                                                                                   |
| C7  | `ToolPage.astro:108-119` : 12 ternaires.                                                                                                                 | P2       | Table `{id: Component}`.                                                                                                                |
| C8  | `CATEGORIES`/`CATEGORY_TEXT` (`lib/blog.ts`) dupliquent l'enum de `content.config.ts`.                                                                   | P2       | Dériver l'enum.                                                                                                                         |

## 5. Styles

`tokens.css` (207 lignes) couvre polices, échelle de texte, espacements, rayons, ombres, durées, z-index, couleurs sémantiques, tons `--tone-*`. Couleurs en dur : quasi nulles (quelques `#000/#fff` d'impression et masque).

| #   | Constat                                                                                                                                                              | Priorité | Correction proposée                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------- |
| T1  | `site.css` (3112 lignes) : `.page-hero` défini à ~592 puis ~2655 (la seconde annule le principe de `CLAUDE.md` « le bas du hero fournit l'espace »). _(à confirmer)_ | P1       | Fusionner, vérifier visuellement 1440/375 px. |
| T2  | `.section-head` défini à ~622 puis ~1346 (grid, autre marge). _(à confirmer)_                                                                                        | P1       | Idem.                                         |
| T3  | Doublons sans conflit réel : `.hm-contact`, `.hm-cta`, `.post-body`, `.post-aside`, `.site-footer` ; `.row-actions` (tools.css, `gap` différents).                   | P2       | Regrouper.                                    |
| T4  | `.jobs { margin-top … !important }` (`site.css` ~2933).                                                                                                              | P2       | Supprimer le `!important`.                    |
| T5  | `rgb(0 0 0 / .45)` en dur (`site.css` ~525) ; ~19 `rem` d'espacement en dur ; 6-7 points de rupture différents.                                                      | P2       | Tokeniser.                                    |
| T6  | `Base.css` 72 Ko brut (13,5 Ko gzip).                                                                                                                                | P2       | Découper par page si le gain est mesuré.      |

## 6. Blog

Collection `blog` (`glob('**/*.md')`), frontmatter : `title`, `seoTitle?`, `description` (50-160), `summary?`, `draft?`, `date`, `updated?`, `translationOf?`, `script?`, `category` (enum de 8), `tags` (1-6). EN dans `content/blog/en/` avec `translationOf`. Brouillons exclus (page, lien, sitemap, flux : `drafts.test.ts`). L'article Java4Shell s'y intégrera tel quel (`draft: true`).

## 7. Outils (12) et QR code

dns, propagation, ics-split, ics-compare, email-headers, subnet, encoder, password, json, units, seo, sitemap. Tous en Preact + `tools-core` (logique pure testée). Briques déjà partagées dans `src/tools/ui/` : `Button`, `Field` (erreur, compteur, `aria-invalid`), `Choice`, `CopyButton`, `Tabs`, `FileDrop`, `Finding`, `Rows`, `ScrollRegion`, `EmptyState`, `download.ts`, `useDebounced`.

Divergences : gestion de la copie (dns/propagation ont la leur), erreurs (`Field.error` vs `role="alert"` ad hoc), `<details>` repliables sans composant commun (5 usages), état d'URL partagé dupliqué entre dns et propagation. **Il n'existe pas d'outil QR code** : il sera ajouté (phase 4), avec un composant `Collapsible` extrait et réutilisé.

## 8. Cookies et scripts tiers

GA4 : injecté par `public/js/consent.js` **uniquement après « Accepter »** ; Consent Mode v2, `ad_*` refusé. Turnstile (`challenges.cloudflare.com`) : chargé à l'approche du formulaire de contact, **sans consentement** (anti-bot). À vérifier : mention dans `/confidentialite/` _(non vérifié)_ — **P2**. Aucun autre script tiers.

## 9. Images et polices

Pas d'`astro:assets` : 4 `<img>`, toutes SVG avec `width`/`height` ; peu de raster. Cartes OG : 5,6 Mo de PNG (partage uniquement, non chargées par les pages) — **P2** : compresser. Polices auto-hébergées (Bricolage Grotesque, Atkinson Hyperlegible Next, JetBrains Mono ; woff2 latin + latin-ext, ~250 Ko pour 8 fichiers), 2 préchargées, CSP `font-src 'self'`. `font-display` : une seule occurrence dans `fonts.css`, effet réel _(à vérifier)_. Le brief demande `astro:assets` : pas utile ici (SVG), à ne pas introduire sans besoin.

## 10. Sécurité

- `pnpm audit --prod` : **3 vulnérabilités (2 faibles, 1 modérée), toutes dans `astro` ≤ 7.4.4**, corrigées en ≥ 7.4.5 (ex. GHSA-mh32-jxcr-mh9f, XSS par noms de balises dynamiques). **P1** : `pnpm up astro`, relancer les tests. Impact réel probablement limité (site statique) _(2 des 3 avis non lus)_.
- `set:html` : un seul, `Base.astro:104` (JSON-LD, via `jsonForScript`) ; vérifier l'échappement de `</script>` dans `lib/seo.ts` _(à confirmer)_. Aucun `dangerouslySetInnerHTML`/`innerHTML`.
- Aucun `target="_blank"` dans les templates ; `window.open(…,'noopener')` dans le terminal.
- Secrets : seul `.env.example` est suivi par git.
- CSP : stricte (hachages, pas de `unsafe-inline` pour les scripts). `style-src-attr 'unsafe-inline'` justifié par Shiki (ADR 0005).

## 11. Accessibilité et responsive

Présents : lien d'évitement, landmarks, un h1 (4 pages échantillonnées), `lang`, `:focus-visible`, `prefers-reduced-motion`, menu mobile avec `aria-expanded`, labels de formulaire. Contrastes testés par `packages/ui/tests/contrast.test.ts`.

**Non vérifié :** cibles tactiles ≥ 24 px (liens d'icônes `SocialLinks`, pied de page), h1 unique sur toutes les pages, présence d'un `<footer>`. **Tests e2e :** un seul projet Chromium, thème sombre forcé, `reducedMotion: reduce` ; test de débordement (320/768/1440) sur 3 pages seulement ; pas de thème clair, pas de mobile ni WebKit. **P2** : étendre en phase 3 aux largeurs 320 → 1920 sur toutes les pages principales, deux thèmes.

## 12. Identité visuelle actuelle

Encre chaude + papier ; accent terracotta unique ; deux tons de cartes ; Bricolage Grotesque (titres), Atkinson Hyperlegible Next (texte), JetBrains Mono ; cartes arrondies 1,75 rem ; blobs/vagues décoratifs ; menu en liens nus. Historique : fiche technique (ADR 0010) → atelier (0011) → relevé (0012) → cartes colorées (0013, **10 novembre**, soit 10 jours). Voir `docs/da-preview/README.md` pour la proposition.

## 13. Checklist de non-régression (pour la phase 6)

- [ ] Production en statique + PHP seulement ; aucun Node à l'exécution.
- [ ] Pas de `<style>`, script en ligne ni `style=""` manuel (sauf JSON-LD et Shiki) ; tests CSP verts.
- [ ] Aucune couleur en dur ; tokens ; `.band` à deux tons.
- [ ] 70 URL du contrat (`pnpm test:contract`, avec et sans `CONTRACT_DIST`) ; `.htaccess` généré, jamais écrit à la main ; slugs d'outils figés.
- [ ] Parité FR/EN, hreflang réciproques, bascule de langue vers la page équivalente.
- [ ] Sitemap `/root-access.xml` + copies ; tags, `/design/`, 404 exclus ; brouillons exclus partout.
- [ ] Menu à plat (7 entrées + Contact), sous-menu Outils (survol, clavier, Échap), fil d'Ariane.
- [ ] Lien d'évitement, bandeau de cookies premier dans le DOM, refus mémorisé sans GA4, aucun script tiers avant accord.
- [ ] Thème clair/sombre mémorisé ; aucun défilement horizontal de 320 à 1920 px ; site lisible sans JS.
- [ ] Terminal de l'accueil (commandes, historique, Tab, désactivation, Konami).
- [ ] Formulaire de contact (`client:visible`, erreurs groupées, Turnstile, confirmation, textes EN).
- [ ] 12 outils : e2e, axe deux thèmes, FAQ, JSON-LD `WebApplication`, encadré confidentialité.
- [ ] Cheatsheets : recherche MiniSearch, JSON à jour, aucun CDN.
- [ ] `llms.txt`, `og-cards.json`, `search-index.json`, RSS FR/EN, `/.well-known/ai-catalog.json`.
- [ ] Profil : aucune mention de la ville ; dépôt privé non lié ; avatar et favicons régénérés ensemble ; réseaux en icônes seules.
- [ ] `pnpm verify` vert avant tout push.

## 14. Questions ouvertes pour vous

1. **Robots d'entraînement IA** : la règle actuelle les **autorise** (GPTBot, ClaudeBot, Google-Extended, etc.). Gardez-vous cette préférence ?
2. **ai-catalog.json** : quelle URL le validateur appelait-il ? Je propose la redirection 301 de la racine vers `/.well-known/`.
3. **Direction artistique** : voir `docs/da-preview/README.md`. Elle remplacerait une identité livrée il y a 10 jours ; voulez-vous une évolution ciblée (recommandé) ou une refonte ?
