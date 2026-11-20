# Stratégie SEO v2.2 : ce que disent vos données

Date : 2026-11-20. Sources : exports Search Console (web, 3 derniers mois, données du 30/09 au 18/11/2026) et rapport d'indexation du 16/11. Les exports bruts ne sont pas commités (dépôt public) ; seuls les chiffres utiles sont repris ici. Les causes proposées sont des **hypothèses**, pas des certitudes : je n'ai ni la concurrence ni l'historique des positions.

## 1. Cadrage honnête de l'objectif

« N°1 sur le web » n'est pas un objectif mesurable : la position se gagne requête par requête. Ce qui est réaliste, d'après vos chiffres :

- **Viser le top 3 sur des requêtes de niche** où vous êtes déjà dans le top 10 (outils ICS, convertisseur Go/Gio, requêtes de marque).
- **Viser le top 10 sur des requêtes à intention précise** (« exemple de rapport SEO PDF », « erreur sitemap Search Console », « calcul masque CIDR ») avec des pages qui répondent exactement à la question.
- **Ne pas chercher la première place sur les termes génériques** (« rapport SEO », « seo report », « spf dkim dmarc ») : vous y êtes à la position 20-60, face à des sites à très forte autorité. Cela dépend surtout de liens entrants, qu'aucune modification technique ne crée.

Aucun réglage ne garantit une position. Je ne promets pas de résultat chiffré.

## 2. Ce que montrent les chiffres

**Volume.** 62 clics, 9 874 impressions, CTR 0,63 %, position moyenne ~29. Avant le 15 octobre, presque aucune impression (57 en 15 jours) ; depuis le 16 octobre, 140 à 430 par jour. Sur les 14 derniers jours : environ 343 impressions et 2,2 clics par jour. Le site est donc encore **dans sa phase de démarrage** : la tendance est à la hausse, ce n'est pas un plateau.

**Où viennent les clics.**

| Page                      | Clics | Impressions | Position |
| ------------------------- | ----- | ----------- | -------- |
| `/en/tools/ics-splitter/` | 31    | 265         | 6,2      |
| `/` (accueil)             | 10    | 153         | 10,4     |
| `/en/tools/ics-compare/`  | 7     | 38          | 5,5      |
| `/outils/ics-decouper/`   | 5     | 40          | 6,7      |

Les 4 pages ICS font **44 des 62 clics (71 %) pour 3,6 % des impressions** : quand une page est dans le top 10 sur une intention précise, elle convertit (CTR ~12 %). Tout le reste est entre les positions 20 et 70, donc quasi invisible.

**Impressions sans clics (pages mal placées).** `/outils/seo/` 2 561 impressions (pos. 40,7) ; `/en/blog/windows-10-end-of-support…` 1 574 (pos. 8,5, 2 clics) ; `/en/blog/spf-dkim-dmarc-explained/` 1 020 (pos. 22,8) ; `/en/tools/seo/` 884 (pos. 69,7) ; `/en/tools/sitemap/` 621 (pos. 54,3) ; `/blog/migration-messagerie-google-workspace-microsoft-365/` 457 (pos. 42).

**Requêtes.** Familles dominantes : « rapport seo / rapport audit seo / rapport audit site web pdf » (environ 2 400 impressions cumulées, pos. 35-50) ; « sitemap errors » (547, pos. 57) ; « spf dkim dmarc » et variantes (nombreuses, pos. 16-40) ; migration Google Workspace → Microsoft 365 (pos. 30-60) ; conversions Go/Gio/GB/GiB (pos. 1-12, peu d'impressions chacune). Beaucoup de requêtes sur Windows 10/11 reprennent le texte du bandeau de fin de support de Microsoft : intention faible, à ne pas prioriser. Requête de marque : « grichard » pos. 2,7 (17 impressions) mais « guillaume richard » pos. 25 (46 impressions, nom très répandu).

**Audience.** France 2 852 impressions (22 clics, pos. 37,7) ; États-Unis 1 577 (5 clics) ; Luxembourg 917 (0 clic, pos. 52,7) ; Belgique 530 (6 clics, pos. 29). Ordinateur : 85 % des impressions ; mobile 14 %. Une partie importante de l'audience est anglophone : les versions EN comptent autant que les FR.

**Apparence dans les résultats : vide.** Aucun résultat enrichi. À ma connaissance, Google n'affiche plus les résultats enrichis FAQ que pour de rares sites institutionnels : le `FAQPage` des outils n'a pas de raison d'en produire. Ce n'est pas une anomalie à corriger.

## 3. Le recoupement le plus utile

Plusieurs articles qui répondent **exactement** aux requêtes où vous avez déjà des impressions figurent dans la liste « Détectée, actuellement non indexée / jamais explorée » :

| Requêtes avec impressions                                                | Article qui répond                                 | État d'après la liste d'indexation |
| ------------------------------------------------------------------------ | -------------------------------------------------- | ---------------------------------- |
| rapport seo, rapport audit seo, rapport audit site web pdf (~2 400 imp.) | `/blog/rapport-audit-seo-checklist-modele/` (+ EN) | non exploré                        |
| sitemap errors (547), sitemap checker                                    | `/blog/sitemap-xml-erreurs-search-console/` (+ EN) | non exploré                        |
| calcul masque, calcul cidr, calcul vlsm, subnet /16                      | `/blog/calcul-masque-cidr-expliques/` (+ EN)       | non exploré                        |

Aujourd'hui ce sont les **pages d'outils** qui se positionnent sur ces requêtes (positions 35-70) parce que l'article qui y répond le mieux n'a pas été exploré. C'est le point d'action le plus rentable et le plus vérifiable.

## 4. Plan d'actions, classé par rapport gain/effort

Fait dans cette phase :

- ✅ Le calculateur réseau (FR et EN) renvoie maintenant vers l'article masque/CIDR (il n'avait aucun lien vers lui). Les outils SEO et sitemap renvoyaient déjà vers leurs articles (vérifié dans le HTML généré).

À faire par vous dans la Search Console (je n'y ai pas accès), **dans cet ordre** :

1. **Inspection d'URL → « Demander une indexation »** (quelques-unes par jour) pour : `/blog/rapport-audit-seo-checklist-modele/`, `/en/blog/seo-audit-report-checklist-template/`, `/blog/sitemap-xml-erreurs-search-console/`, `/en/blog/sitemap-xml-errors-search-console/`, `/blog/calcul-masque-cidr-expliques/`, `/en/blog/cidr-subnet-mask-explained/`. Cela accélère l'exploration, sans garantir l'indexation.
2. Regarder l'état exact de ces 6 URL (« L'URL n'est pas sur Google » + dernière exploration) et me le transmettre.

À faire sur le site, avec votre accord (aucun de ces points n'est commencé) :

| #   | Action                                                                                                                                                                                                                                                               | Justification par les données                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | **Convertisseur d'unités** : le titre EN est « Download Time Calculator » alors que les requêtes sont « gb to gib », « gib to bytes », « gio vs go », « 1024 mo en go » (positions 1 à 12). Aligner le titre, le H1 et l'introduction sur « GB to GiB / Go en Gio ». | Pages déjà bien placées (pos. 8,5 EN, 11,8 FR) mais intention mal servie : gain de CTR probable. |
| 2   | **Outils ICS** : ajouter un article pratique (« Comment découper un fichier ICS / Google Agenda ») et un lien depuis les pages ICS. Renforcer la version FR (requêtes « fichier .ics », « fichiers ics », « ics archive » aux positions 21-80).                      | Vos meilleures pages ; la version EN fait déjà 31 clics. Chercher à les consolider.              |
| 3   | **Cibler des requêtes à longue traîne plutôt que « rapport seo »** : titres/H1 orientés « exemple de rapport SEO PDF », « modèle de rapport d'audit SEO » sur l'article, une fois indexé.                                                                            | « exemple rapport seo », « rapport seo pdf » existent déjà en requêtes (positions 7-40).         |
| 4   | **Requête de marque** : vérifier que l'accueil et `/a-propos/` portent « Guillaume Richard » et son métier dans le `<title>`/H1, et que le `sameAs` de la `Person` pointe vers vos profils réels (cohérence non recoupée à ce jour).                                 | « guillaume richard » pos. 25 : homonymes, une identité claire aide Google à relier les pages.   |
| 5   | **Titres des 9 articles de plus de 60 caractères** : raccourcir.                                                                                                                                                                                                     | Risque de troncature (P2).                                                                       |
| 6   | **Article Windows 10 EN** (1 574 impressions, CTR 0,13 % à la position 8,5) : tester une autre description, après avoir vérifié que les requêtes sont réelles et non le texte du bandeau Microsoft.                                                                  | CTR très inférieur à celui d'une position 8 normale ; hypothèse snippet, à tester.               |

Leviers hors site (les plus puissants pour monter, **non automatisables par moi**) :

- **Liens entrants de qualité** : votre dépôt GitHub public (lien dans le README et le profil), LinkedIn, et surtout des mentions éditoriales (communautés techniques, forums d'entraide où vos outils répondent à une vraie question). Pas d'échanges de liens ni d'annuaires douteux : ils nuisent plus qu'ils n'aident.
- **Régularité** : continuer de publier des articles qui répondent à une question précise, avec vos propres outils comme preuve.

## 5. Suivi

Exporter la Search Console tous les 7 à 14 jours et suivre quatre nombres : pages indexées, impressions, nombre de requêtes en position ≤ 10, clics. Comparer à la base du jour : 62 clics / 9 874 impressions sur la période, ~2,2 clics par jour sur les 14 derniers jours. Un résultat se lit sur plusieurs semaines, pas en quelques jours.
