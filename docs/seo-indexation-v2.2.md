# Indexation du blog et du site : diagnostic v2.2

Date : 2026-11-20. Deux choses sont distinguées partout dans ce document :

- **Indexabilité technique** : ce que je peux vérifier (HTML généré, en-têtes, production via `curl`).
- **Indexation constatée dans Google** : je n'y ai pas accès. La seule donnée disponible est la capture du rapport Pages de la Search Console que vous m'avez transmise (ci-dessous).

## 1. Donnée Search Console reçue

Rapport « Pages » → « Détectée, actuellement non indexée », mis à jour le 16/11/2026, validation « Commencée » le 20/11/2026 :

- **104 pages**, liste complète (1-104 sur 104). La courbe monte depuis fin août.
- **Dernière exploration : « Sans objet » pour les 104.**
- Contenu : des articles FR et EN (la grande majorité), des cheatsheets, des réalisations (`/projets/…`, `/en/projects/…`), des catégories de blog, les pages d'accueil des outils (`/outils/`, `/en/tools/`) et `/accessibilite/`.

### Ce que cela signifie

« Détectée, actuellement non indexée » avec « Dernière exploration : Sans objet » veut dire que **Google connaît l'URL (sitemap, liens) mais ne l'a jamais téléchargée**. Ce n'est donc **pas** un verdict de Google sur la qualité de ces pages (ce serait « Explorée, actuellement non indexée », avec une date d'exploration). C'est un état de file d'attente : Google n'a pas encore planifié leur exploration.

Pour un domaine récent avec peu de liens entrants, c'est un comportement fréquent : Google explore d'abord une partie du site, puis étale le reste. Il n'y a pas d'erreur technique à corriger pour cet état précis, et la validation que vous avez lancée ne fait que redemander à Google de recontrôler.

### Ce que j'ai écarté (vérifié)

| Hypothèse                             | Vérification                                                                                 | Résultat                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------- |
| Serveur lent ou en erreur             | `curl` en production, UA Googlebot : temps jusqu'au premier octet de 79 à 121 ms sur 5 pages | Pas de problème de vitesse |
| Pages en erreur ou en redirection     | 178 URL du sitemap : toutes en 200 direct, 0 redirection                                     | OK                         |
| `noindex` / `X-Robots-Tag` par erreur | Aucune des 178 URL n'est en `noindex` (meta ni en-tête)                                      | OK                         |
| canonical incohérente                 | canonical = URL du sitemap = URL servie, pour les 178                                        | OK                         |
| `robots.txt` bloquant                 | Seuls `/contact.php` et `/tools.php` sont bloqués ; `/_astro/` accessible                    | OK                         |
| Contenu absent sans JavaScript        | 561 à 1396 mots dans le HTML brut de chaque article                                          | OK                         |
| Pages orphelines                      | Chaque article reçoit au moins un lien interne ; 31 articles à 3 clics de l'accueil          | OK                         |
| Soft 404                              | Une URL inexistante renvoie un vrai 404                                                      | OK                         |

### Ce que je ne peux pas écarter : hypothèses à tester

Je ne peux pas dire laquelle est la bonne ; ce sont des pistes classées par plausibilité.

1. **Priorisation de l'exploration (la plus probable).** Le site publie beaucoup de pages d'un coup (363 pages générées, 35 articles FR + 35 EN) sur un domaine récent. Signal à noter : parmi les articles FR, ceux qui **ne figurent pas** dans la liste sont les plus anciens et les plus « fondamentaux » (`spf-dkim-dmarc-expliques`, `delivrabilite-diagnostiquer-mails-spam-rejetes`, `diagnostic-dns-dig-nslookup-propagation-ttl`, `migration-messagerie-google-workspace-microsoft-365`, `securiser-microsoft-365-google-workspace-reglages-de-base`, `fin-support-windows-10-passer-a-windows-11`). Cela ressemble à une exploration progressive, ancienne contenu d'abord. À confirmer en regardant leur état dans la Search Console.
2. **Faible autorité du domaine** : peu ou pas de liens entrants externes, donc faible « demande » d'exploration.
3. **Dilution de l'exploration** : le site expose 184 pages de tag en `noindex, follow` (reliées depuis chaque article) que Google doit explorer pour constater le noindex, et une version EN de chaque page. C'est une hypothèse sur le gaspillage d'exploration, **non démontrée** : à ne traiter qu'après les vérifications ci-dessous.
4. **Contenu perçu comme proche d'autres sources** (articles d'actualité sur des failles très couvertes) : ne concerne que les pages déjà explorées, donc pas l'état actuel « Sans objet ».

## 2. Vérifications que vous devez faire dans la Search Console

À faire dans cet ordre (je n'y ai pas accès) :

| #   | Vérification                                                                                                                                                                                                               | Ce que le résultat signifie                                                                                                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Rapport Pages, totaux** : combien de pages « Indexées » ? Y a-t-il d'autres motifs (« Explorée, actuellement non indexée », « Exclue par noindex », « Page avec redirection ») ?                                         | Les 74 URL du sitemap absentes de la liste sont soit indexées, soit dans un autre motif. Si « Explorée, non indexée » apparaît, c'est un signal de qualité/priorité, différent de l'état actuel.                                                                                                                         |
| 2   | **Inspection d'URL** sur 3 articles : un de la liste (ex. `/blog/calcul-masque-cidr-expliques/`), un absent (ex. `/blog/spf-dkim-dmarc-expliques/`), un récent (ex. `/blog/panne-microsoft-365-outlook-12-novembre-2026/`) | « L'URL n'est pas sur Google » + « Découverte : sitemap » + « Dernière exploration : N/A » confirme la file d'attente. Si l'inspection en direct réussit (« Page accessible », canonical choisie par Google = la vôtre), il n'y a rien à corriger côté site. Si la canonical choisie par Google diffère, notez laquelle. |
| 3   | **Demander l'indexation** (inspection d'URL) pour 5 à 10 pages clés : accueil, blog, 3 à 4 articles. Quota limité (quelques-unes par jour).                                                                                | Accélère l'exploration de ces pages ; ne garantit pas l'indexation. Inutile de le faire pour les 104.                                                                                                                                                                                                                    |
| 4   | **Sitemaps** : le sitemap soumis est-il bien `root-access.xml` avec statut « Succès » et 178 pages découvertes ? Ne pas resoumettre `sitemap.xml` ni `sitemap-0.xml`.                                                      | Un statut « Succès » avec 178 pages découvertes exclut un problème de lecture. Un autre nombre signale un souci de lecture à investiguer.                                                                                                                                                                                |
| 5   | **Paramètres → Statistiques sur l'exploration** : requêtes par jour, temps de réponse moyen, répartition par type de réponse sur 90 jours.                                                                                 | Si les requêtes sont très peu nombreuses (quelques dizaines par jour), l'exploration est limitée par la demande, pas par un blocage. Un pic de 5xx ou de 404 serait en revanche à corriger.                                                                                                                              |
| 6   | **Liens** : combien de sites externes pointent vers grichard.eu ?                                                                                                                                                          | Zéro ou presque : hypothèse 2 confirmée ; le levier est alors externe (profils, articles invités, annuaires pertinents), pas technique.                                                                                                                                                                                  |

Rappel : « Détectée / Explorée, actuellement non indexée » sur un site petit et récent relève souvent de la priorisation de Google et pas forcément d'un défaut technique. Le délai habituel est de plusieurs semaines. Il n'existe aucune action technique qui force l'indexation.

## 3. Ce que je peux améliorer côté site (sans prétendre résoudre l'état ci-dessus)

Ces actions réduisent le risque et facilitent l'exploration ; leur effet sur l'indexation n'est pas démontrable à l'avance.

- **Maillage depuis les pages les plus explorées** : 4 articles sont à 1 clic de l'accueil et 31 à 3 clics. Des liens « articles liés » plus systématiques entre articles proches rapprocheraient les pages profondes de l'accueil. À décider avec vous.
- **Pages de tag** : à examiner seulement si les statistiques d'exploration (n° 5) montrent que Google explore surtout des tags. Option : ne plus lier les tags (ils restent en `noindex`).
- **Signaux de fraîcheur honnêtes** : ne changer `dateModified` que lors d'une vraie révision (68 articles sur 70 ont aujourd'hui `dateModified` = date de publication, ce qui est correct).
- **Bing** (non vérifié) : IndexNow n'est pas utilisable tel quel en hébergement statique sans script ; à étudier plus tard si Bing vous intéresse.

## 4. Technique : état et corrections de cette phase

| Sujet                        | Constat (vérification)                                                                                                                                                                                                                                                                               | Action                                                                                                                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sitemap                      | `root-access.xml` : 178 URL absolues, `application/xml`, 0 doublon, `lastmod` des articles = `dateModified`. Déclaré dans `robots.txt` (seule ligne `Sitemap:`).                                                                                                                                     | Aucune. `sitemap.xml` et `sitemap-0.xml` restent des copies identiques ; `sitemap-index.xml` n'est pas publié (volontaire).                                                                                                                      |
| canonical                    | Auto-référente, https, sans www, avec slash final, partout.                                                                                                                                                                                                                                          | Aucune.                                                                                                                                                                                                                                          |
| hreflang                     | fr / en / x-default, réciproque, uniquement entre pages traduites (35 paires). Pas de hreflang sur les tags.                                                                                                                                                                                         | Aucune. Aucun hreflang ne sera ajouté vers la version EN de Java4Shell tant qu'elle n'existe pas.                                                                                                                                                |
| robots.txt                   | Recherche et assistants IA autorisés ; **robots d'entraînement refusés (changement de cette phase, décidé par vous)** : GPTBot, Google-Extended, ClaudeBot, anthropic-ai, Claude-Web, CCBot, Applebot-Extended, Bytespider, Meta-ExternalAgent, cohere-ai. Googlebot et Bingbot ne sont pas touchés. | Modifié et testé (`dist.test.ts`). **Limite** : `robots.txt` est une demande, que les robots respectueux suivent ; il n'empêche rien techniquement. `Google-Extended` n'affecte pas l'indexation Google Search.                                  |
| `/ai-catalog.json`           | Renvoyait un 404 HTML à la racine (l'URL appelée par le validateur) ; le fichier n'existait que sous `/.well-known/`.                                                                                                                                                                                | **Corrigé** : copie identique servie à la racine en 200 `application/json` (postbuild), test, contrat d'URL, contrôle de déploiement. Aucune redirection : un validateur attend le JSON à cette URL. À vérifier en production après déploiement. |
| `/sitemap-index.xml`         | 404 en production.                                                                                                                                                                                                                                                                                   | Aucune : `root-access.xml` est la référence (décision).                                                                                                                                                                                          |
| `.htaccess`                  | Aucune règle ne renvoie du HTML en 200 pour une URL inconnue ; 404 réel ; `ErrorDocument 404` et 403 ; MIME `.json` déclaré, `.xml` par défaut Apache (`application/xml` constaté).                                                                                                                  | Voir « À corriger » ci-dessous.                                                                                                                                                                                                                  |
| Redirections                 | `/x` → `/x/` en 301 puis 200 ; HTTP→HTTPS et www→apex en un saut.                                                                                                                                                                                                                                    | Voir « À corriger ».                                                                                                                                                                                                                             |
| Tags, catégories, pagination | Tags : `noindex, follow`, hors sitemap. Catégories : indexables, canonical propre. Pas de pagination (35 articles).                                                                                                                                                                                  | Aucune.                                                                                                                                                                                                                                          |

### À corriger (P2, prochains commits de la phase 2)

- Les `Location` des redirections contiennent `https://grichard.eu:443/…` (port explicite) : à corriger dans `htaccess.mjs` (sans effet SEO, esthétique).
- Les redirections HTTP→HTTPS / www→apex perdent la query string : ajouter `QSA`.
- `/404.html` porte un canonical vers elle-même : à retirer (déjà protégée par `noindex`).
- 9 titles de 61-62 caractères : à raccourcir si vous le souhaitez.

## 5. Données structurées (JSON-LD)

Types présents : `WebSite` + `ProfilePage` + `Person` (accueil), `AboutPage`, `CreativeWork` / `SoftwareSourceCode` (réalisations), `TechArticle` (cheatsheets), `WebApplication` + `FAQPage` (outils), `BlogPosting` + `BreadcrumbList` (articles). Syntaxe JSON valide sur les 70 articles. Cohérence de la `Person` (`worksFor`, `sameAs`, `email`) avec le contenu visible : **non recoupée**, à contrôler.

## 6. Journal des vérifications

| Date       | Commande ou méthode                                       | Résultat                                             |
| ---------- | --------------------------------------------------------- | ---------------------------------------------------- |
| 2026-11-20 | `curl -A Googlebot` sur les 178 URL de `/root-access.xml` | 178 × 200, 0 redirection, canonical = URL, 0 noindex |
| 2026-11-20 | `curl -s -w %{time_starttransfer}` sur 5 pages            | 79 à 121 ms                                          |
| 2026-11-20 | Analyse de `dist/` (363 HTML) par script Node             | voir l'audit, §3                                     |
| 2026-11-20 | `pnpm --filter @grichard/web test`                        | 12 fichiers, 1663 tests passés                       |
| 2026-11-20 | `CONTRACT_DIST=apps/web/dist pnpm test:contract`          | 131 contrôles passés                                 |
