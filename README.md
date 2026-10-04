# Portfolio — Guillaume Richard

Site personnel bilingue (FR/EN) : React 19 + Vite + Tailwind CSS 4, hébergé sur OVH (mutualisé, Apache + PHP).
Production : <https://grichard.eu>

## Architecture

Le site est **entièrement pré-rendu** au build (HTML statique, lisible sans JavaScript). React n'hydrate que des zones
interactives (« îlots ») : le formulaire de contact sur l'accueil, l'outil DNS sur sa page. Le menu, la bascule de thème, le surlignage de section, l'effet de halo des cartes et le
bandeau de cookies sont de petits scripts autonomes (`public/js/`), qui fonctionnent sur toutes les pages sans React.

```
index.html              Gabarit de développement uniquement (le HTML de production est généré par le pré-rendu)
src/
  data/content.js       TOUT le contenu (FR/EN), liens, mentions légales, chemins par langue (LANGS)
  main.jsx              Point d'entrée navigateur : charge et hydrate uniquement les îlots présents dans la page (en dev, rend toute la page)
  islands/              Un module par îlot (contact.jsx, terminal.jsx, tools/<id>.jsx), chargé dynamiquement : chaque page ne télécharge que son code
  App.jsx               Accueil (assemble les sections) ; la langue vient de l'URL ('/' = FR, '/en/' = EN), pas d'un état
  entry-server.jsx      Fonctions de rendu utilisées par le pré-rendu
  index.css             Design system : jetons de thème, échelles, composants (.btn, .card, .field…), effets (voir plus bas)
  components/
    ui/                 Primitives : Button, Card, Field, ThemeToggle, EmptyState
    home/               Sections de l'accueil : Hero, About, Skills, Experience, Projects, LatestPosts, EducationAndContact
    SiteHeader, SiteFooter   En-tête flottant et pied de page communs à TOUTES les pages (accueil, blog, légal, 404)
    ContactForm, ContactIsland, ErrorBoundary   Le formulaire de contact (îlot) et son filet de sécurité
    terminal/           InteractiveTerminal : le terminal interactif de l'accueil (îlot)
    tools/              Outils : ToolPage (page générique pré-rendue), ToolsHub, registry.jsx, un composant par outil (DnsChecker, IcsSplit, IcsCompare…)
    Blog, LegalPage, NotFound, Shell            Pages statiques (rendues au build, jamais hydratées)
    PostMeta, SectionHeading, Decor, Terminal, Icons
  hooks/useTurnstile.js Cycle de vie du widget Cloudflare Turnstile (chargement, nouvelle tentative, jeton)
  lib/                  format.js (dates), cx.js (classes), islands.js (identifiants et données des îlots)
  lib/ics/, lib/zip.js  Bibliothèque iCalendar pure (parse, dates et fuseaux, build, split, compare) et écriture de ZIP
  data/tools/           Registre des outils (index.js), page « Outils » (hub.js) et textes de chaque outil
  lib/dns/              Analyse DNS pure (sans React ni DOM) : résolveur DoH, spf, dkim, dmarc, mx, txt, records, extras, providers, analyze, report
  lib/terminal/         Interpréteur du terminal (commands.js : fonctions pures) et données qu'il consulte (data.js)
  data/dns-tool.js      Textes de l'outil DNS (FR/EN) : interface et un message par code de constat
  data/terminal.js, data/palette.js   Textes du terminal ; textes et mots-clés de la palette
content/blog/*.md       Articles en français (front matter : title, description, date, updated optionnel, script optionnel ; slug = nom du fichier)
content/blog/en/*.md    Traductions anglaises (mêmes champs + translationOf : slug de l'article français correspondant)
scripts/
  prerender.js          Orchestre la génération : accueil FR/EN, mentions légales, blog, 404.html, sitemap.xml, llms.txt
  lib/                  Briques testées : markdown.js (front matter, sommaire), dates.js, page.js (gabarit <head>),
                        schema.js (JSON-LD), sitemap.js, assets.js (lecture du manifeste Vite), git.js,
                        rss.js (flux RSS), og.js (images de partage), pdf.js (PDF des CV)
public/                 Copié tel quel dans dist/ : contact.php, .htaccess, robots.txt, llms.txt, og-image.png, PDF, icônes,
                        cv-fr.html / cv-en.html (sources des CV pour générer les PDF ; non servies : `.htaccess` les bloque)
public/js/              Scripts autonomes (voir « Scripts autonomes ») : theme.js, nav.js, fx.js, palette.js, consent.js, table-filter.js, 404.js
tests/unit/             Vitest : pré-rendu (front matter, dates, sitemap, gabarit, RSS), cohérence du contenu, analyse DNS (tests/unit/helpers/fake-dns.js)
tests/e2e/              Playwright + axe : accessibilité (2 thèmes), responsive, thème, formulaire, navigation, contenu de dist/
```

Pages produites : `/`, `/en/`, `/mentions-legales/`, `/en/legal-notice/`, `/blog/`, `/blog/<slug>/`, `/en/blog/`, `/en/blog/<slug>/`, `404.html`.
Le sitemap et `llms.txt` sont entièrement générés au build : aucune URL à maintenir à la main. Les `hreflang` sont déclarés dans le
`<head>` de chaque page (le sitemap reste volontairement « pur », sans `xhtml:link`, pour passer les validateurs XSD stricts).
Le sélecteur de langue mène à la page équivalente (la traduction d'un article, l'index du blog, les mentions légales…).

### Choix de conception

- **État** : uniquement local (`useState` dans `ContactForm`). Pas de Redux, Context ni bibliothèque de data fetching :
  le site n'a qu'un appel réseau (`POST /contact.php`).
- **Une seule zone hydratée** : le HTML de l'accueil contient `#contact-root` et un `<script type="application/json" id="islands-data">`
  (langue et textes du formulaire). `main.jsx` les relit et hydrate le formulaire ; le reste n'est jamais hydraté, donc
  l'année du pied de page ou une section statique ne peuvent pas provoquer de désaccord d'hydratation. Le JavaScript de React
  (≈ 73 Ko gzip) ne sert qu'au formulaire ; les pages de blog n'en chargent pas du tout.
- **Pas de code splitting** (`React.lazy`) : une seule page et un seul point d'entrée, il n'y aurait rien à découper.
- **Amélioration progressive** : sans JavaScript, le menu mobile est affiché en clair, la bascule de thème est masquée et le thème
  suit le système ; les sections apparaissent sans animation.
- **Front matter minimal** (`scripts/lib/markdown.js`) plutôt que YAML : les titres contiennent des « : » qu'un parseur YAML strict
  refuserait sans guillemets. En contrepartie, toute erreur (ligne sans « : », clé inconnue ou en double, date mal formée) fait échouer le build.

## Artefacts produits au build

- **Flux RSS** : `/rss.xml` (FR) et `/en/rss.xml` (EN), contenu complet des articles, liens absolus. Déclarés dans le `<head>` de l'accueil, du blog et des articles (découverte automatique).
- **Images de partage** : une image 1200 × 630 par article dans `dist/og/<slug>.png` (titre en grand, charte du site), utilisée par `og:image`, `twitter:image` et le JSON-LD de l'article. Rendu par Chromium (Playwright), mis en cache dans `.cache/og/` (ignoré par Git) : seuls les articles nouveaux ou modifiés sont rendus.
- **PDF des CV** : `dist/CV_Guillaume_Richard_FR.pdf` et `dist/Resume_Guillaume_Richard_EN.pdf` sont **régénérés** depuis `public/cv-fr.html` et `public/cv-en.html` (impression A4 par Chromium, cache dans `.cache/cv/`). Les sources chargent Tailwind, Inter et Lucide depuis des CDN : le rendu n'est accepté que si elles ont chargé ; sinon le PDF de `public/` est conservé et un avertissement s'affiche. **Pour modifier un CV, éditez le HTML** (les PDF de `public/` ne sont plus que le secours).
- Chromium est requis : `npx playwright install chromium` (déjà fait par la CI). `BUILD_FAST=1 npm run build` saute images et PDF pour un build rapide ; sans Chromium, le build continue avec l'image générique et les PDF de `public/`.

## Outils (`/outils/`, `/en/tools/`)

Une page « Outils » liste les outils ; chacun a sa page (FR et EN) pré-rendue (explications, FAQ, données structurées `WebApplication` + `FAQPage`, fil d'Ariane) et son
îlot hydraté, chargé à la demande. **Un seul registre** (`src/data/tools/index.js`) alimente la page « Outils », le menu, la palette de commandes, le plan du site, `llms.txt`
et le JSON-LD. Pour **ajouter un outil** : ses textes FR/EN (`src/data/tools/<id>.js`, mêmes clés dans les deux langues : `tests/unit/tools.test.js` le vérifie), son composant
(`src/components/tools/`, déclaré dans `registry.jsx`), son îlot (`src/islands/tools/<id>.jsx`) et une entrée dans le registre.
Les outils de fichiers et de texte tournent **entièrement dans le navigateur** : rien n'est envoyé. Seul l'outil DNS interroge des résolveurs publics.

### Découpeur ICS (`/outils/ics-decouper/`) et comparateur ICS (`/outils/ics-comparer/`)

- **Analyse tolérante** (`src/lib/ics/parse.js`) : exports Google, Outlook, Apple, Thunderbird ; lignes dépliées ; BOM ; `\r`, `\n` ou `\r\n` ; composants non fermés ; plusieurs
  `VCALENDAR` concaténés. Les événements gardent leurs lignes d'origine : ils sont **recopiés à l'identique**, jamais re-sérialisés (participants, rappels, champs `X-` conservés).
- **Dates et fuseaux** (`dates.js`) : date, UTC, flottante, avec `TZID` ; fuseaux IANA via `Intl`, noms **Windows** d'Outlook (« Romance Standard Time »…), préfixes Mozilla et
  `X-LIC-LOCATION` ; changement d'heure géré ; durées. Deux heures équivalentes dans des fuseaux différents sont reconnues comme identiques.
- **Découpage** (`split.js`) : par nombre d'événements, par taille, par année, par mois, un événement par fichier, par calendrier. Une **série et ses exceptions** (même `UID`) restent toujours
  dans le même fichier ; chaque fichier n'embarque que les `VTIMEZONE` utilisés ; lignes repliées à 75 octets sans couper un caractère. Téléchargement fichier par fichier ou en **ZIP**
  (`src/lib/zip.js`, archive « stockée » écrite à la main, vérifiée avec l'extraction de Windows).
- **Comparaison « source moins destination »** (`compare.js`) : identité par `UID`, par **contenu** (titre + début + fin + récurrence, utile quand un import a régénéré les UID, ex. Google → Outlook)
  ou les deux. Sort les événements **à importer**, les **déjà présents**, les **modifiés** (même UID, contenu différent : titre, début, fin, lieu, récurrence, statut…), ceux **seulement en destination**
  et les **doublons** de chaque fichier ; chaque événement de la destination n'est consommé qu'une fois ; signale les **exceptions orphelines** (exception de série dont le maître est absent des deux fichiers).
  Options : casse du titre, heure de fin, description, dédoublonnage, inclusion des modifiés. Le fichier produit est un `.ics` valide prêt à importer.
- Limites : 50 Mo par fichier ; les heures flottantes (sans fuseau) ne sont comparables qu'entre elles ; un fuseau inconnu n'est comparé que sur son texte.

## Outil DNS et e-mail (`/outils/dns/`, `/en/tools/dns/`)

Vérificateur de domaine : **A, AAAA, MX, SPF, DKIM, DMARC, TXT, NS, SOA, CAA, DNSSEC, MTA-STS, TLS-RPT, BIMI**, avec une section « Doublons ».
Les requêtes partent du **navigateur du visiteur** vers Cloudflare puis Google (DNS-over-HTTPS, format JSON, `do=1` pour DNSSEC) : le site
n'héberge aucun relais et ne stocke rien. La CSP autorise `cloudflare-dns.com` et `dns.google` dans `connect-src`.

- **SPF** : syntaxe de chaque terme, `+all`/`?all`/`~all`/`-all`, `ptr`, plages trop larges ou redondantes, doublons, boucles, include introuvables,
  et **décompte des requêtes DNS** en suivant récursivement `include` et `redirect` (limite de 10, requêtes « vides » limitées à 2).
  Dans un `include`, la qualification du `all` final est ignorée (elle est sans effet) ; seul `+all` est signalé.
- **DKIM** : taille de clé lue dans le DER (RSA < 1024 erreur, 1024 avertissement, ≥ 2048 conforme ; Ed25519), clé tronquée ou révoquée, `t=y`, SHA-1 seul,
  CNAME délégué (Microsoft 365), plusieurs enregistrements au même sélecteur, même clé sous plusieurs sélecteurs. **Sans sélecteur saisi, il est deviné** :
  le fournisseur est reconnu d'après les MX et les `include` SPF (`src/lib/dns/providers.js`), puis ses sélecteurs documentés sont essayés
  (Google `google`, Microsoft 365 `selector1`/`selector2`, OVH `ovhmo-selector-1`/`-2`, Zoho, Proton, Fastmail, SendGrid, Mailchimp, Brevo…),
  puis des noms courants (`default`, `dkim`, `mail`…). Pour ajouter un fournisseur, ajoutez une entrée à `PROVIDERS`.
- **DMARC** : chaque balise, politique (`none` = surveillance seulement), `pct`, alignements, adresses `rua`/`ruf`, héritage du domaine d'organisation
  pour un sous-domaine, et **autorisation des rapports envoyés à un autre domaine** (`<domaine>._report._dmarc.<destinataire>`).
- **MX** : hôtes qui résolvent, pas de CNAME, pas d'IP, adresses non routables, MX nul (RFC 7505), doublons, redondance.
- Les statuts : *erreur* (invalide ou inefficace), *avertissement* (risque ou mauvaise pratique), *information*, *conforme*. Un message traduit (titre, détail,
  correction) existe pour chaque code de constat (`src/data/dns-tool.js`) ; `tests/unit/dns-tool.test.js` échoue si un code manque dans une langue.
- Une analyse est partageable par lien (`?d=exemple.fr&s=selecteur`) ; le rapport se copie en Markdown.
- Limites : le domaine d'organisation est déduit d'une courte liste de suffixes à deux niveaux (pas de liste des suffixes publics complète) ;
  la politique MTA-STS (`https://mta-sts.<domaine>/.well-known/mta-sts.txt`) n'est pas lisible depuis un navigateur (CORS) ; un sélecteur DKIM au nom
  inhabituel ne peut pas être deviné (l'outil le dit et invite à le saisir).

## Terminal interactif et palette de commandes

- **Terminal** (accueil, îlot React) : de vraies commandes — `help`, `whoami`, `about`, `skills`, `experience`, `projects`, `education`, `blog`, `contact`, `links`, `cv`, `ls`, `cat`,
  `goto <section>`, `theme [dark|light]`, `lang [fr|en]`, `clear` (et quelques œufs de Pâques). Historique (↑/↓), complétion par Tab, Ctrl+L. Les trois commandes d'ouverture
  se tapent en CSS (décoratives, masquées aux lecteurs d'écran) ; ensuite le champ est un vrai `<input>` étiqueté, les résultats sont annoncés (`role="log"`), des suggestions
  cliquables remplacent le clavier sur mobile, et Tab ne piège jamais le focus. Aucune saisie n'est interprétée comme du HTML. L'interpréteur (`src/lib/terminal/commands.js`)
  est pur : il retourne des lignes et une action, le composant exécute l'action (défilement, thème, langue). Textes : `src/data/terminal.js`.
- **Palette** (toutes les pages, JS autonome) : Ctrl/Cmd + K, « / » (hors champ de saisie) ou le bouton de loupe ouvre une recherche de pages, d'articles, de sections et d'actions
  (thème, langue de la page courante, copier l'e-mail, CV, GitHub, LinkedIn, RSS, haut de page). Recherche sans accent ni casse, titres > mots-clés > descriptions. Index
  `/search-index.json` généré au build (`scripts/lib/search-index.js`) et chargé à la première ouverture seulement. `<dialog>` natif (focus piégé, Échap, retour du focus).
  Pour qu'une nouvelle page y figure, l'ajouter à `buildSearchIndex` (les articles y entrent d'eux-mêmes).

## Design system et thèmes

Tout est dans `src/index.css`, sans configuration Tailwind séparée (Tailwind 4 : `@theme`).

- **Jetons sémantiques** : `canvas`, `surface`, `raised`, `line`, `line-strong`, `ink` (titres), `body` (texte), `muted`, `brand` (accent
  décoratif), `link` (texte accentué), `brand-strong` (fond des boutons), `accent`, `danger`. Ils existent en variables CSS, une valeur
  par thème, et sont exposés en classes Tailwind (`bg-surface`, `text-body`, `border-line`…). **N'écrivez plus de couleur en dur
  dans un composant** : ajoutez ou réutilisez un jeton.
- **Thèmes clair et sombre** : sombre par défaut, clair ensuite. `public/js/theme.js` (chargé dans le `<head>`, sans `defer`, donc sans
  flash) pose `data-theme` sur `<html>` d'après le choix mémorisé (`localStorage`, clé `theme`) ou, à défaut, le réglage du système ;
  il suit le système tant qu'aucun choix manuel n'existe. La bascule (`ThemeToggle`, `data-theme-toggle`) fonctionne sur toutes les
  pages ; avec « réduire les animations » elle est instantanée, sinon le nouveau thème se déploie en cercle (View Transitions).
  Le terminal de l'accueil et les blocs de code restent volontairement sombres/neutres selon leurs propres jetons.
- **Échelles** : texte fluide (`text-display`, `text-title`, `text-lead`, `text-copy`, `text-meta`, via `clamp()`), espacement de section
  (`space-y-section`), rayons (`rounded-card`, `rounded-control`), ombres (`shadow-card`, `shadow-glow`), courbe `ease-soft`.
- **Composants partagés** : boutons (`.btn` + `btn-primary|secondary|ghost`, 44 px de haut minimum, états hover / active / disabled /
  loading), cartes (`.card`, `.card-glow`), champs (`.field`), étiquettes (`.tag`), liens (`.link`, `.tap` pour une zone de 44 px),
  squelette (`.skeleton`), état vide (`EmptyState`). Les composants React de `components/ui/` n'assemblent que ces classes.
- **Contrastes** : texte courant ≥ 7:1 dans les deux thèmes, `link` ≥ 5:1 sur toutes les surfaces. Vérifié par axe dans `tests/e2e`.
- **Mouvement** : transitions ciblées (`transition-colors`, `transform`…, jamais `transition-all` en dehors de la page 404),
  `prefers-reduced-motion` coupe toute animation. Aucune animation décorative ne tourne en continu : le dégradé du nom (5 s), le
  curseur (4 clignotements) et l'écriture du terminal se jouent une fois (WCAG 2.2.2) ; seul le squelette de chargement boucle.
- **Effets** : en-tête flottant en verre dépoli avec barre de progression de lecture (CSS pur, `animation-timeline: scroll()`), halo de
  bordure qui suit le pointeur sur les cartes (`fx.js`, souris uniquement), reflet sur le bouton principal, fond à halos et grille,
  transitions de page fondues entre les pages statiques (View Transitions inter-documents, navigateurs compatibles).
- **Impression** : fond neutre, sans en-tête ni bandeau.

## Scripts autonomes (`public/js/`)

Ils sont versionnés par empreinte (`?v=<hash>`) et servis depuis `'self'` : la CSP n'autorise aucun script en ligne.

| Script | Rôle | Chargement |
|---|---|---|
| `theme.js` | Thème clair/sombre, `meta theme-color`, classe `js` sur `<html>` | `<head>`, sans `defer` |
| `nav.js` | Menu mobile (clic, Échap, clic extérieur, focus), surlignage de la section visible (`aria-current="location"`) | `defer`, toutes les pages |
| `fx.js` | Halo des cartes qui suit le pointeur (souris uniquement, rien si mouvement réduit) | `defer`, toutes les pages |
| `palette.js` | Palette de commandes (Ctrl/Cmd + K, « / », bouton de l'en-tête) : `<dialog>` + combobox ARIA, index chargé à la première ouverture | `defer`, toutes les pages |
| `consent.js` | Bandeau de cookies et Google Analytics après consentement | `defer`, toutes les pages |
| `table-filter.js`, `404.js` | Filtre de tableau d'un article ; bouton esquiveur de la 404 | à la demande (`script:` d'un article, page 404) |

## Développement

```bash
npm install
cp .env.example .env.local   # renseigner VITE_TURNSTILE_SITE_KEY (obligatoire pour `npm run build`)
npm run dev                  # http://localhost:5173 (gabarit de dev : pas de blog, pas de /en/)
npm run lint                 # oxlint : hooks (dont exhaustive-deps), accessibilité JSX (jsx-a11y), bonnes pratiques
npm test                     # tests unitaires (Vitest)
npm run test:e2e             # construit le site puis lance Playwright + axe (1re fois : npx playwright install chromium)
npm run test:live            # tests contre les VRAIS résolveurs DNS (réseau requis ; hors CI) : vérifie les formats de réponse réels
npm run check                # lint + tests unitaires + e2e, comme la CI
npm run build                # génère dist/ (build Vite + pré-rendu)
```

`npm run build` **échoue** si `VITE_TURNSTILE_SITE_KEY` est absente : sans elle, le widget disparaîtrait et `contact.php`
refuserait tous les messages. Pour un build local sans vraie clé, utiliser la clé de test Cloudflare `1x00000000000000000000AA`.

Pour ajouter un article : créer `content/blog/<slug>.md` avec son front matter. Pour sa version anglaise, créer `content/blog/en/<slug-en>.md`
avec `translationOf: <slug français>` (le build échoue si ce slug n'existe pas), puis `npm run build`. Les deux versions sont reliées
(`hreflang`, lien « Read this article in English », sélecteur de langue) ; un article sans traduction fonctionne aussi.
Pour ajouter un texte : tout se passe dans `src/data/content.js` ; `tests/unit/content.test.js` vérifie que FR et EN
ont exactement les mêmes clés.

## Tests et intégration continue

- **Unitaires** (`npm test`, Vitest) : front matter (cas d'erreur compris), ancres et sommaire, dates ISO avec fuseau (heure d'été/hiver),
  gabarit HTML, sitemap, manifeste Vite, parité FR/EN du contenu, validité de tous les articles et de leurs traductions.
- **Bout en bout** (`npm run test:e2e`, Playwright) sur le site construit (`tests/e2e/dns-tool.spec.js` couvre l'outil DNS avec de faux résolveurs DoH) :
  - axe (WCAG 2.x A/AA) sur 9 pages **dans chacun des deux thèmes**, et sur le bandeau de cookies ;
  - structure et SEO (langue, un seul `h1`, canonical, hreflang, sélecteur de langue vers la traduction) ;
  - responsive : aucun scroll horizontal de 320 à 2560 px, cibles tactiles ≥ 44 px sur mobile ;
  - thème : suit le système, bascule, mémorisation, `aria-pressed` ; site utilisable sans JavaScript ;
  - navigation : menu mobile (Échap, clic extérieur, retour du focus), surlignage de section, bandeau de cookies atteint en premier au clavier ;
  - formulaire : validation par champ, compteur, succès (focus sur la confirmation, second envoi), 429, coupure réseau,
    Turnstile injoignable, squelette, état occupé ; absence d'erreur d'hydratation ;
  - contenu de `dist/`.
  Turnstile est remplacé par un double : aucun test ne dépend du réseau.
- **Tests « live »** (`npm run test:live`, `tests/live/`) : l'outil DNS contre Cloudflare et Google pour de vrai (TXT, MX nul, NXDOMAIN, DNSSEC, CAA, analyse de gmail.com et microsoft.com). À lancer de temps en temps : ils détectent un changement de format des résolveurs. Les domaines tiers peuvent évoluer.
- **CI** (`.github/workflows/ci.yml`) : à chaque push et pull request, `npm ci`, lint, `npm audit` (dépendances de production),
  tests unitaires puis e2e ; le rapport Playwright est conservé en cas d'échec. La CI utilise la clé de test Turnstile.

## Déploiement (OVH)

1. `npm run build`, puis envoyer le contenu de `dist/` à la racine du site (y compris `.htaccess`).
2. Créer `contact.config.php` (modèle : `contact.config.example.php`) avec la **clé secrète** Turnstile, et le placer
   **au-dessus** de la racine web (à côté du dossier `www/`). `contact.php` l'y cherche en premier ;
   à défaut, il accepte aussi un fichier voisin de `contact.php` (bloqué à l'accès HTTP par `.htaccess`).
3. Après un changement de `.htaccess`, tester : `http://grichard.eu`, `https://www.grichard.eu` (redirection 301 vers
   `https://grichard.eu/`) et une URL inexistante (404 avec la page « troll »).

## Cookies et mesure d'audience

Google Analytics n'est chargé qu'après un clic sur « Accepter » (`public/js/consent.js`) ; le choix est mémorisé 6 mois
dans `localStorage` et modifiable via « Gérer les cookies » (pied de page). Aucun script Google n'est chargé avant.
Le bandeau est inséré en tête de `<body>` (atteint dès le premier Tab), ses boutons font 44 px de haut et « Refuser » a le même
poids visuel qu'« Accepter ». Les mentions légales (section 5) décrivent ce fonctionnement : à tenir à jour si l'outil change.

## Captcha — Cloudflare Turnstile

- Créer un widget sur <https://dash.cloudflare.com/?to=/:account/turnstile> (domaine `grichard.eu`).
- Clé de **site** (publique) → `VITE_TURNSTILE_SITE_KEY` au moment du build (le build échoue sans elle).
- Clé **secrète** → `contact.config.php` (ou variable d'environnement `TURNSTILE_SECRET`).
- Le widget ne se charge que lorsque le formulaire approche de l'écran (`useTurnstile`) ; un squelette tient sa place en attendant,
  et un bouton « Recharger la vérification » apparaît si le script est injoignable. Un champ honeypot complète la protection.
- `contact.php` échoue en mode fermé : sans secret, aucun e-mail n'est envoyé.
- Côté interface, chaque cas a son message : captcha non validé ou refusé (403), trop de messages (429), script Turnstile
  injoignable, réseau coupé ou délai de 15 s dépassé, erreur serveur.

## Accessibilité

Lien d'évitement, focus visible (3 px, couleur de marque dans les deux thèmes), hiérarchie h1 → h2 → h3, une seule `<header>`,
un seul `<main>` et un seul `<footer>` par page, `prefers-reduced-motion` respecté, contrastes AA dans les deux thèmes.
Menu mobile : `aria-expanded`, libellé qui change (ouvrir/fermer), Échap et retour du focus, clic extérieur. Section courante :
`aria-current="location"` ; page courante (Blog) : `aria-current="page"`. Bascule de thème : `aria-pressed`.
Formulaire : champs obligatoires signalés (astérisque + `required`), erreurs par champ reliées par `aria-describedby` et
`aria-invalid`, focus sur le premier champ en erreur, région live au rôle stable (`role="status"`), champs en lecture seule
(pas `disabled`) pendant l'envoi pour ne pas faire perdre le focus, focus déplacé sur la confirmation après envoi.
Cibles tactiles ≥ 44 px (boutons et liens autonomes ; seuls les liens au fil d'une phrase en sont dispensés).
Le contrôle est automatisé : axe dans `tests/e2e` (deux thèmes), règles `jsx-a11y` dans `npm run lint`.

## Sécurité

- **Secrets** : seule la clé *de site* Turnstile (publique) est dans le build. La clé secrète vit dans `contact.config.php`, ignoré par Git,
  placé au-dessus de la racine web ; `.htaccess` bloque aussi ce fichier, les sauvegardes (`.bak`, `~`…) et les fichiers cachés (`.git`, `.env`).
- **Formulaire** (`public/contact.php`) : Turnstile vérifié côté serveur (nom de domaine du jeton contrôlé), honeypot, contrôle de l'origine,
  nom et e-mail nettoyés contre l'injection d'en-têtes, aucune erreur PHP renvoyée.
- **Limitation d'envois** : 15 messages par heure au total et 3 par heure et par visiteur (un seul client ne peut pas épuiser
  le plafond global). Le compteur est un fichier temporaire manipulé sous un seul verrou (`flock`) : deux requêtes simultanées
  ne peuvent pas dépasser la limite. Il ne contient qu'une empreinte salée de l'IP, conservée au plus une heure ;
  les mentions légales (section 4) le précisent : à tenir à jour si ce mécanisme change.
- **En-têtes** : CSP sans `unsafe-inline` pour les scripts (tous les scripts sont des fichiers de `'self'`, d'où `theme.js` externe et
  sans `defer` plutôt qu'en ligne), HSTS, anti-clickjacking, `nosniff`, Referrer-Policy, Permissions-Policy.
  `style-src` garde `'unsafe-inline'` par prudence (comportement du widget Turnstile, non vérifiable hors production) :
  à retirer seulement après un essai sur le vrai site.
- **Contenu** : les articles Markdown sont de confiance (rendus tels quels, `marked` n'assainit pas le HTML) ; n'y collez jamais de HTML
  d'origine inconnue. La CSP (aucun script en ligne) limite l'impact d'une erreur.
- **Contact sécurité** : `/.well-known/security.txt` (champ `Expires` à renouveler avant le 30 septembre 2027).
- Contrôle régulier : `npm audit` (exécuté aussi par la CI).
