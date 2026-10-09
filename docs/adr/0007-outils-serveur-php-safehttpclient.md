# ADR 0007 : outils serveur en PHP (rapport SEO, sitemap) et client HTTP protégé contre la SSRF

**Statut** : accepté (2026-10-09)

**Contexte.** Le rapport SEO et le vérificateur de sitemap doivent lire un site tiers : la page, son `robots.txt`, ses sitemaps et un échantillon de liens. Un navigateur ne le peut pas (CORS). Il faut donc un serveur, et l'hébergement n'offre que PHP 8.5 (ADR 0002). Un outil qui fait des requêtes sortantes à la demande d'un visiteur est la cible classique de la **SSRF** : faire contacter par le serveur une adresse interne (réseau privé de l'hébergeur, `127.0.0.1`, métadonnées d'un cloud).

**Décision.**

- **Un point d'entrée** `tools.php` (racine web) et le code dans `app/api/` hors de la racine, comme le formulaire de contact. `GET ?csrf` émet le jeton ; `POST {tool, url, turnstileToken}` renvoie un rapport JSON.
- **`Grichard\Api\Net`**, couche commune aux deux outils :
  - `Url` : http/https, ports 80/443, sans identifiants, IDN en punycode, hôtes locaux refusés, écritures exotiques d'IPv4 refusées (`2130706433`, `0x7f.1`, `0177.0.0.1`, `127.1`) ;
  - `IpPolicy` : seules les IP publiques passent, y compris les IPv4 cachées dans IPv6 (mappées, 6to4, NAT64, Teredo) ;
  - `SafeHttpClient` :
    - le nom est résolu, et la requête est refusée si **une seule** adresse n'est pas publique ;
    - la connexion est **épinglée** sur l'adresse validée (`CURLOPT_RESOLVE`), contre le DNS rebinding ;
    - les redirections sont suivies **une à une et revalidées** (5 au plus) ;
    - délais courts, budget global par analyse, corps plafonné, aucun proxy, User-Agent identifiable ;
    - requêtes parallèles par `curl_multi`.
- **Garde-fous d'entrée** (`ToolGuard`), du moins cher au plus cher :
  1. méthode, puis origine ;
  2. jeton CSRF en double soumission (cookie `__Host-grtools` `HttpOnly` `SameSite=Strict` + en-tête `X-CSRF-Token`) ;
  3. Turnstile ;
  4. quotas par IP et global : 12 analyses SEO et 6 vérifications de sitemap par heure et par visiteur.
- **Réponses en codes, textes côté site.** Le serveur renvoie des identifiants de contrôle et des valeurs mesurées. Les titres, explications et recommandations (FR/EN) sont dans `apps/web/src/tools/{seo,sitemap}/checks.ts`. Un test lit le code PHP pour garantir que chaque contrôle a son texte.
- **Analyse HTML** par `Dom\HTMLDocument` (parseur HTML5 de PHP 8.4+), et **XML** par `XMLReader` en flux, avec `DOCTYPE` refusé et `LIBXML_NONET` (XXE).
- **RGPD.** Ni l'URL analysée, ni la page, ni le rapport ne sont conservés ou journalisés. Seule une empreinte salée de l'IP est conservée, une heure, pour les quotas.

**Alternatives écartées.**

- Un service tiers d'audit : il faudrait une clé d'API et des données envoyées à un tiers, avec un coût.
- Un worker Node : impossible chez l'hébergeur.
- `file_get_contents` avec `allow_url_fopen` : il ne permet ni d'épingler l'IP, ni de contrôler chaque redirection.

**Conséquences.**

- cURL et les connexions sortantes doivent être disponibles chez OVH. Sinon, l'outil répond `unavailable` sans casser la page.
- Le temps d'exécution est borné par le budget du client (22 à 25 s).
- Ajouter un outil serveur demande :
  - une classe dans `apps/api/src/<Outil>/` ;
  - une entrée dans `tools.php` (garde-fou et quota) ;
  - un dossier `apps/web/src/tools/<id>/` qui réutilise `tools/server/ServerTool.tsx`.
