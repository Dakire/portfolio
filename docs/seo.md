# SEO technique : sitemap, indexation, vérifications

## Sitemap : quelle URL fait référence

| URL                  | Rôle                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`/sitemap.xml`**   | **Référence.** Liste d'URL (`<urlset>`), déclarée dans `robots.txt`, à soumettre dans la Search Console.                                          |
| `/sitemap-0.xml`     | Copie identique, conservée parce qu'elle a déjà été soumise à la Search Console. Peut être retirée de la Search Console ; le fichier reste servi. |
| `/sitemap-index.xml` | N'est plus publié (jamais déclaré ; la livraison le supprime du serveur).                                                                         |

**Génération** (reproductible, aucune édition à la main) : `@astrojs/sitemap` (`apps/web/astro.config.mjs`) écrit `sitemap-index.xml` et `sitemap-0.xml` ; `apps/web/scripts/postbuild.mjs` (`sitemap()`) en tire `sitemap.xml` (même contenu, espaces de noms inutilisés retirés) et supprime l'index. Au-delà de 50 000 URL, le build échoue au lieu de publier un sitemap partiel.

**Contenu** : toutes les pages indexables et auto-canoniques, et seulement elles. Exclus : `/404`, page de style, pages de filtre du blog (`noindex`), redirections. `<lastmod>` seulement quand la date est réelle (articles, index du blog), jamais la date du build.

### Diagnostic du 15 octobre 2026 (« sitemap.xml » en erreur dans la Search Console, « sitemap-0.xml » accepté)

Mesures en production (GET, sans suivre les redirections, avec un User-Agent Googlebot et un User-Agent ordinaire) :

- `https://grichard.eu/sitemap.xml` : **200**, `application/xml`, XML valide… mais c'était un **index de sitemaps** (`<sitemapindex>`) d'une seule entrée renvoyant vers `sitemap-0.xml`, pas une liste de pages. `http://`, `www.` : une seule 301 vers cette URL.
- `https://grichard.eu/sitemap-0.xml` : 200, `application/xml`, `<urlset>` de 88 URL. Les 88 répondent 200, sont auto-canoniques et indexables, sans doublon.
- Historique : jusqu'au 9 octobre 2026, l'ancien site servait à `/sitemap.xml` une liste d'URL. Depuis la mise en ligne du site Astro, `postbuild.mjs` y copiait l'index d'`@astrojs/sitemap`. **La même URL soumise a changé de nature** (liste → index) ; la Search Console a donc dû la retraiter, et l'index lui-même portait un `<lastmod>` (date du dernier article, 3 octobre) antérieur aux changements de `sitemap-0.xml` (14 octobre) : un index qui dit « rien n'a changé » n'incite pas Google à relire le sitemap enfant.

Ce qui n'est **pas** la cause : la syntaxe XML, le type MIME, le code HTTP, `robots.txt`, la CSP ou les règles `.htaccess` (toutes vérifiées). L'état exact affiché par la Search Console (« Impossible de récupérer », « Le sitemap est un fichier HTML », date de dernière lecture…) n'est pas accessible d'ici : il faut le relever dans l'interface pour confirmer. Un sitemap tout juste soumis reste aussi souvent « Impossible de récupérer » quelques jours, sans erreur réelle.

**Correction** : `/sitemap.xml` redevient une liste d'URL directe, sans index intermédiaire (un fichier, un seul GET, aucun `lastmod` d'index à maintenir). Pas de redirection : la Search Console traite une URL de sitemap redirigée de façon peu prévisible, et `sitemap-0.xml` est déjà soumis.

### Après la mise en production : dans la Search Console

1. **Sitemaps** : supprimer puis soumettre de nouveau `sitemap.xml` (force une nouvelle lecture). Vérifier « Réussite » et le nombre d'URL découvertes (88 au 15 octobre 2026).
2. Supprimer `sitemap-0.xml` de la liste (facultatif : il reste valide, mais deux sitemaps identiques n'apportent rien).
3. **Inspection d'URL** sur `https://grichard.eu/sitemap.xml` n'est pas pertinente (ce n'est pas une page) ; inspecter plutôt une page récente (une page d'outil) et demander l'indexation si elle n'est pas encore connue.

## Vérifier, à tout moment

```bash
pnpm --filter @grichard/web sitemap:check                         # production : robots.txt, sitemap.xml, chaque URL (GET)
pnpm --filter @grichard/web sitemap:check -- https://exemple.fr   # autre site
CONTRACT_BASE_URL=https://grichard.eu pnpm test:contract          # contrat (lancé aussi par le déploiement)
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://grichard.eu/sitemap.xml
```

Tests automatiques : `apps/web/tests/unit/dist.test.ts` (sur le build : `<urlset>` UTF-8, URL absolues et uniques, `lastmod` valides, chaque URL existante, indexable et auto-canonique, aucune page indexable oubliée, `robots.txt` cohérent) ; `tests/contract` (type `sitemap` : `<urlset>` complet, sur le build et en ligne après chaque livraison).

## Ancienne préproduction

`https://grichard.eu/preprod/` répondait encore 200 le 15 octobre 2026 (ancien site complet, `noindex` par en-tête et balise). Le `.htaccess` de production renvoie désormais **410 Gone** pour `/preprod/…`. Reste à faire à la main, par FTP : supprimer `www/preprod/` et `app/preprod/` (voir [deploiement.md](deploiement.md)).
