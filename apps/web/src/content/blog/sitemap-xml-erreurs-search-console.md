---
title: 'Erreurs de sitemap.xml dans la Search Console : causes et corrections'
seoTitle: 'Erreurs sitemap.xml : causes et corrections (Search Console)'
description: "Impossible de récupérer le sitemap, format HTML, URL non autorisée : les causes d'un sitemap.xml refusé et comment les corriger, avec un testeur gratuit."
summary: "Les erreurs de sitemap les plus courantes dans la Search Console (impossible de récupérer, sitemap HTML, URL non autorisée, trop d'URL), leurs causes, les règles du format sitemap.xml et comment tester son fichier gratuitement."
date: 2026-11-10
category: web
tags: ['Sitemap', 'SEO', 'Search Console', 'robots.txt', 'Indexation']
---

Un **sitemap.xml** liste les pages qu'on veut voir explorées par les moteurs de recherche. Quand la Search Console le refuse (« Impossible de récupérer le sitemap », « Le sitemap est au format HTML »…), c'est presque toujours une des causes ci-dessous. Voici comment les repérer et les corriger.

## En bref

- Testez d'abord le fichier avec le [vérificateur de sitemap](/outils/sitemap/) : il lit le `robots.txt`, valide la syntaxe XML et signale doublons, URL bloquées et dépassements de limite.
- Un sitemap valide contient **au plus 50 000 URL et 50 Mo non compressés**, en UTF-8, avec des **URL absolues** du même site.
- Ne listez que des pages **indexables, en code 200, sans redirection** et non bloquées par `robots.txt` ni par `noindex`.
- Déclarez-le dans `robots.txt` avec une ligne `Sitemap: https://exemple.fr/sitemap.xml`.

## Les erreurs de la Search Console et leurs causes

| Message                                     | Cause la plus fréquente                                                                                      | Correction                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Impossible de récupérer le sitemap          | adresse fausse, 404, 403 (pare-feu ou plugin de sécurité), redirection, `robots.txt` qui bloque le fichier   | ouvrir l'URL dans un navigateur et avec `curl -I`, viser un 200 |
| Le sitemap est au format HTML               | l'URL renvoie une page HTML (page d'erreur, page de connexion, thème du CMS)                                 | servir du XML avec le type `application/xml`                    |
| Erreur d'analyse XML                        | caractère `&` non échappé (`&amp;`), balise non fermée, BOM ou texte avant `<?xml`, encodage autre que UTF-8 | valider le XML, échapper `&`, `<`, `>`, `'` et `"` dans les URL |
| URL non autorisée                           | une URL du sitemap n'est pas sous le même site (autre domaine, `www` différent, `http` au lieu de `https`)   | n'y mettre que des URL du site exact qui contient le sitemap    |
| Trop d'URL                                  | plus de 50 000 URL ou plus de 50 Mo                                                                          | découper en plusieurs sitemaps et un **index de sitemaps**      |
| URL bloquée par robots.txt                  | la page figure au sitemap mais `Disallow` l'interdit                                                         | retirer la page du sitemap ou lever le blocage                  |
| Sitemap accepté mais pages « non indexées » | pages en `noindex`, en doublon, redirigées, en 404, ou canonical vers une autre page                         | n'inclure que les pages canoniques, en 200, indexables          |

## Les règles du format

- Une racine `<urlset>` (liste de pages) ou `<sitemapindex>` (liste de sitemaps), avec l'espace de noms `http://www.sitemaps.org/schemas/sitemap/0.9`.
- Chaque `<url>` contient au minimum un `<loc>` : l'adresse **absolue** de la page.
- `<lastmod>` est facultatif, mais s'il est présent il doit être **vrai** : une date qui change à chaque génération, sans modification réelle, finit par être ignorée par Google. Format W3C (`2026-11-10` ou `2026-11-10T09:30:00+01:00`).
- `<priority>` et `<changefreq>` sont ignorés par Google : inutile de les soigner.
- Un sitemap **compressé** (`.xml.gz`) est accepté, la limite de 50 Mo s'appliquant au fichier décompressé.

## Liste d'URL ou index : ne pas changer de nature

Un cas concret rencontré sur ce site, le 15 octobre 2026 : la Search Console signalait une erreur sur `/sitemap.xml` alors que `/sitemap-0.xml` était accepté. Le fichier était pourtant du XML valide, en code 200 et avec le bon type. La seule différence : l'ancienne version de cette adresse était **une liste d'URL**, et la nouvelle un **index de sitemaps** renvoyant vers `sitemap-0.xml`. La même URL soumise avait changé de nature.

La correction a été de redonner à `/sitemap.xml` sa forme de liste d'URL directe, sans index intermédiaire. Aucune garantie que ce soit la seule cause possible (la Search Console reste vague sur le détail), mais la règle pratique est simple : **quand une adresse de sitemap est déjà soumise, gardez sa nature (liste ou index)**, et si vous devez changer, soumettez la nouvelle adresse.

## Procédure de vérification

1. Ouvrez l'URL du sitemap dans un navigateur : du XML s'affiche, pas une page de site.
2. Vérifiez l'en-tête avec `curl -I https://exemple.fr/sitemap.xml` : code **200** et `Content-Type: application/xml` (ou `text/xml`).
3. Passez-le dans le [vérificateur de sitemap](/outils/sitemap/) : syntaxe, nombre d'URL, doublons, URL bloquées.
4. Vérifiez que `robots.txt` contient une ligne `Sitemap:` avec l'adresse absolue.
5. Dans la Search Console : **Indexation → Sitemaps**, ajoutez l'adresse et attendez le statut « Réussite ».
6. Contrôlez ensuite quelques pages du sitemap avec le [rapport SEO](/outils/seo/) : code 200, pas de `noindex`, canonical vers elle-même. Voir aussi [le modèle de rapport d'audit SEO](/blog/rapport-audit-seo-checklist-modele/).

## Questions fréquentes

### Mon sitemap est « réussi » mais les pages ne sont pas indexées. Pourquoi ?

Le sitemap n'est qu'une suggestion. Google indexe selon la qualité, l'unicité et l'importance perçue des pages. Vérifiez le détail dans le rapport « Pages » de la Search Console.

### Faut-il un sitemap pour un petit site ?

Pas obligatoire si toutes les pages sont reliées entre elles, mais il reste utile et il ne coûte rien.

### Combien de temps avant que Google lise le sitemap ?

De quelques heures à quelques jours. Un statut « Impossible de récupérer » juste après l'ajout peut disparaître seul ; s'il persiste, relisez le tableau ci-dessus.
