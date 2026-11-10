---
title: "Rapport d'audit SEO : checklist de 30 points, modèle et export PDF"
seoTitle: "Rapport d'audit SEO : checklist, modèle et PDF gratuit"
description: "Que contient un rapport d'audit SEO, dans quel ordre corriger, avec une checklist de 30 points et un outil gratuit pour générer le rapport en PDF."
summary: "Ce que doit contenir un rapport d'audit SEO technique (serveur, indexation, balises, contenu, liens, partage, sécurité), l'ordre de correction, les seuils indicatifs et comment obtenir gratuitement un rapport exportable en PDF."
date: 2026-11-10
category: web
tags: ['SEO', 'Audit', 'Rapport', 'Indexation', 'Balises']
---

Un **rapport d'audit SEO** est la photo technique d'une page ou d'un site à un instant donné : ce qui empêche Google de l'explorer, de l'indexer ou de bien l'afficher, classé par priorité, avec la correction à faire. Voici ce qu'il doit contenir, dans quel ordre agir, et comment en obtenir un gratuitement, y compris au format PDF.

## En bref

- Un bon rapport classe les problèmes en **critique** (la page ne sera pas indexée), **important** (elle sera mal affichée ou mal comprise) et **information**.
- Il traite d'abord le **serveur et l'indexation** (code HTTP, redirections, HTTPS, robots, canonical), puis les **balises** et le **contenu**, puis les **liens**, le **partage** et la **sécurité**.
- L'outil gratuit [Rapport SEO](/outils/seo/) fait plus de 30 contrôles sur une page et propose l'**export JSON** et l'**impression ou l'enregistrement en PDF**.
- Un rapport technique ne dit rien des positions, des backlinks ni de la concurrence : on le complète avec la Search Console.

## Ce que contient un rapport d'audit SEO

| Famille                           | Ce qu'on vérifie                                                                                                              | Pourquoi                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Serveur et HTTP                   | code de réponse (200), chaîne de redirections, HTTPS, HSTS, temps de réponse, compression                                     | une page en erreur ou lente n'est pas (bien) indexée    |
| Indexation                        | balise `meta robots`, en-tête `X-Robots-Tag`, canonical, `robots.txt` (page bloquée ou non), sitemap                          | décide si la page peut apparaître dans les résultats    |
| Balises                           | `title`, meta description, langue, viewport, un seul `h1`, ordre des titres                                                   | c'est ce que Google affiche et comprend en premier      |
| Contenu                           | nombre de mots, attribut `alt` des images                                                                                     | contenu trop mince ou images sans texte alternatif      |
| Liens                             | échantillon de liens testés, liens cassés (404)                                                                               | un lien cassé gaspille l'exploration et dégrade l'usage |
| Partage                           | Open Graph, carte Twitter/X, favicon                                                                                          | l'aperçu quand la page est partagée                     |
| Données structurées               | blocs JSON-LD schema.org : présence, validité, types                                                                          | éligibilité aux résultats enrichis                      |
| Sécurité et accessibilité de base | Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, étiquettes de champs, repères `main`/`nav` | confiance, protection et lecture assistée               |

## Les seuils à connaître (indicatifs)

Google ne publie pas de longueur « officielle » : ce sont des repères d'affichage dans les résultats de recherche.

- **Title** : 30 à 60 caractères environ, unique sur le site, avec le sujet en premier. Au-delà, il est tronqué à l'affichage.
- **Meta description** : 70 à 160 caractères environ. Elle n'influence pas directement le classement, mais elle influence le clic.
- **Un seul `h1`** par page, puis des `h2` et `h3` dans l'ordre, sans sauter de niveau.
- **Redirections** : idéalement aucune, au plus une. Une chaîne de trois redirections ou plus se corrige à la source.
- **Core Web Vitals** (à mesurer avec PageSpeed Insights ou la Search Console) : LCP sous 2,5 s, INP sous 200 ms, CLS sous 0,1.
- **Liens** : aucun lien interne vers une page en 404 ou en redirection.

## Dans quel ordre corriger

1. **Tout ce qui est critique** : page en 404 ou 5xx, `noindex` involontaire, page bloquée par `robots.txt`, canonical qui pointe ailleurs, certificat TLS expiré. Tant que ces points ne sont pas réglés, le reste est secondaire.
2. **Balises** : un `title` et une meta description uniques et soignés, un `h1` clair. C'est le meilleur rapport effort/résultat.
3. **Contenu et liens** : textes alternatifs, liens cassés, pages orphelines (aucun lien interne n'y mène).
4. **Partage et données structurées** : Open Graph pour des aperçus propres, JSON-LD pour les résultats enrichis.
5. **En-têtes de sécurité** : ils comptent peu pour le classement, mais beaucoup pour la confiance et la protection du site.

## Obtenir un rapport gratuit en PDF

1. Ouvrez l'outil [Rapport SEO](/outils/seo/) et saisissez l'adresse d'une page publique.
2. Lancez l'analyse : le score sur 100 et la liste des points à corriger s'affichent, classés par priorité, avec la correction pour chacun.
3. Cliquez sur **Imprimer ou enregistrer en PDF** pour obtenir le rapport à transmettre, ou sur **Exporter en JSON** pour le traiter dans un script.

L'adresse analysée n'est pas conservée. L'outil est limité à 12 analyses par heure, et il n'examine **qu'une page à la fois** : pour un site, répétez l'opération sur les pages clés (accueil, une page de service, un article).

## Ce qu'un rapport technique ne dit pas

- Les **positions** et les mots-clés qui amènent du trafic : c'est le rôle de la [Search Console](https://search.google.com/search-console).
- Les **backlinks** (liens entrants) et l'autorité du domaine.
- La **qualité éditoriale** : un contenu utile et à jour reste le facteur principal.
- Les erreurs de **sitemap**, qui méritent leur propre contrôle : voir [les erreurs de sitemap.xml et leurs corrections](/blog/sitemap-xml-erreurs-search-console/).

## Questions fréquentes

### Un rapport SEO gratuit est-il fiable ?

Pour les contrôles techniques (balises, codes HTTP, redirections, en-têtes), oui : ce sont des faits mesurables. Pour le classement, aucun outil ne peut le garantir.

### À quelle fréquence refaire un audit ?

Après chaque refonte, changement d'hébergeur ou de CMS, et au minimum une fois par trimestre sur les pages importantes.

### Faut-il viser 100 sur 100 ?

Non. Un score est un repère : un point « info » sans conséquence ne justifie pas de casser une page qui fonctionne. Corrigez d'abord le critique, puis l'important.
