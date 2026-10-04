# Portfolio — Guillaume Richard

Site personnel bilingue (FR/EN) : React 19 + Vite + Tailwind CSS 4, hébergé sur OVH (mutualisé, Apache + PHP).
Production : <https://grichard.eu>

## Architecture

Le site est **entièrement pré-rendu** au build (HTML statique, lisible sans JavaScript). React n'hydrate que deux zones
interactives, les « îlots » : le menu (`Header`) et le formulaire de contact. Tout le reste de l'accueil est du HTML statique.
Le JavaScript chargé par le navigateur est donc réduit au strict nécessaire (React + ces deux composants).

```
index.html              Gabarit de développement uniquement (le HTML de production est généré par le pré-rendu)
src/
  data/content.js       TOUT le contenu (FR/EN), liens, mentions légales, chemins par langue (LANGS)
  main.jsx              Point d'entrée navigateur : hydrate les îlots (en dev, rend toute la page côté client)
  islands.jsx           Les deux îlots : HeaderIsland, ContactIsland (formulaire dans un ErrorBoundary)
  App.jsx               Accueil (assemble les sections) ; la langue vient de l'URL ('/' = FR, '/en/' = EN), pas d'un état
  entry-server.jsx      Fonctions de rendu utilisées par le pré-rendu
  components/
    home/               Sections de l'accueil : Hero, About, Skills, Experience, Projects, LatestPosts, EducationAndContact, Footer
    Header, ContactForm, ErrorBoundary    Composants interactifs (îlots)
    Blog, LegalPage, NotFound, Shell      Pages statiques (rendues au build, jamais hydratées)
    PostMeta, SectionHeading, Decor, Terminal, Icons
  hooks/useTurnstile.js Cycle de vie du widget Cloudflare Turnstile
  lib/                  format.js (dates), islands.js (identifiants et données des îlots)
  index.css             Tailwind, focus visible, skip-link, styles des articles et du bandeau de cookies
content/blog/*.md       Articles en français (front matter : title, description, date, updated optionnel, script optionnel ; slug = nom du fichier)
content/blog/en/*.md    Traductions anglaises (mêmes champs + translationOf : slug de l'article français correspondant)
scripts/
  prerender.js          Orchestre la génération : accueil FR/EN, mentions légales, blog, 404.html, sitemap.xml, llms.txt
  lib/                  Briques testées : markdown.js (front matter, sommaire), dates.js, page.js (gabarit <head>),
                        schema.js (JSON-LD), sitemap.js, assets.js (lecture du manifeste Vite), git.js
public/                 Copié tel quel dans dist/ : contact.php, .htaccess, robots.txt, llms.txt, og-image.png, PDF, icônes,
                        cv-fr.html / cv-en.html (sources des CV pour générer les PDF ; non servies : `.htaccess` les bloque)
public/js/              Scripts autonomes : consent.js (bandeau + Google Analytics), table-filter.js, 404.js
tests/unit/             Vitest : pré-rendu (front matter, dates, sitemap, gabarit) et cohérence du contenu
tests/e2e/              Playwright + axe : accessibilité, SEO, hydratation, menu, formulaire, contenu de dist/
```

Pages produites : `/`, `/en/`, `/mentions-legales/`, `/en/legal-notice/`, `/blog/`, `/blog/<slug>/`, `/en/blog/`, `/en/blog/<slug>/`, `404.html`.
Le sitemap et `llms.txt` sont entièrement générés au build : aucune URL à maintenir à la main. Les `hreflang` sont déclarés dans le
`<head>` de chaque page (le sitemap reste volontairement « pur », sans `xhtml:link`, pour passer les validateurs XSD stricts).

### Choix de conception

- **État** : uniquement local (`useState` dans `Header` et `ContactForm`). Pas de Redux, Context ni bibliothèque de data fetching :
  le site n'a qu'un appel réseau (`POST /contact.php`).
- **Îlots** : le HTML de l'accueil contient `#header-root`, `#contact-root` et un `<script type="application/json" id="islands-data">`
  (langue et textes dont les îlots ont besoin). `main.jsx` les relit et hydrate chaque îlot ; le reste n'est jamais hydraté,
  donc l'année du pied de page ou une section statique ne peuvent pas provoquer de désaccord d'hydratation.
- **Pas de code splitting** (`React.lazy`) : une seule page et un seul point d'entrée, il n'y aurait rien à découper.
- **Front matter minimal** (`scripts/lib/markdown.js`) plutôt que YAML : les titres contiennent des « : » qu'un parseur YAML strict
  refuserait sans guillemets. En contrepartie, toute erreur (ligne sans « : », clé inconnue ou en double, date mal formée) fait échouer le build.

## Développement

```bash
npm install
cp .env.example .env.local   # renseigner VITE_TURNSTILE_SITE_KEY (obligatoire pour `npm run build`)
npm run dev                  # http://localhost:5173 (gabarit de dev : pas de blog, pas de /en/)
npm run lint                 # oxlint : hooks (dont exhaustive-deps), accessibilité JSX (jsx-a11y), bonnes pratiques
npm test                     # tests unitaires (Vitest)
npm run test:e2e             # construit le site puis lance Playwright + axe (1re fois : npx playwright install chromium)
npm run check                # lint + tests unitaires + e2e, comme la CI
npm run build                # génère dist/ (build Vite + pré-rendu)
```

`npm run build` **échoue** si `VITE_TURNSTILE_SITE_KEY` est absente : sans elle, le widget disparaîtrait et `contact.php`
refuserait tous les messages. Pour un build local sans vraie clé, utiliser la clé de test Cloudflare `1x00000000000000000000AA`.

Pour ajouter un article : créer `content/blog/<slug>.md` avec son front matter. Pour sa version anglaise, créer `content/blog/en/<slug-en>.md`
avec `translationOf: <slug français>` (le build échoue si ce slug n'existe pas), puis `npm run build`. Les deux versions sont reliées
(`hreflang`, lien « Read this article in English ») ; un article sans traduction fonctionne aussi.
Pour ajouter une langue ou un texte : tout se passe dans `src/data/content.js` ; `tests/unit/content.test.js` vérifie que FR et EN
ont exactement les mêmes clés.

## Tests et intégration continue

- **Unitaires** (`npm test`, Vitest) : front matter (cas d'erreur compris), ancres et sommaire, dates ISO avec fuseau (heure d'été/hiver),
  gabarit HTML, sitemap, manifeste Vite, parité FR/EN du contenu, validité de tous les articles et de leurs traductions.
- **Bout en bout** (`npm run test:e2e`, Playwright) sur le site construit : axe (WCAG 2.x A/AA) sur 9 pages, structure et SEO
  (langue, un seul `h1`, canonical, hreflang), absence d'erreur d'hydratation, menu mobile (Échap, retour du focus),
  formulaire (succès, 429, coupure réseau, Turnstile injoignable), contenu de `dist/`. Turnstile est remplacé par un double :
  aucun test ne dépend du réseau.
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
Les mentions légales (section 5) décrivent ce fonctionnement : à tenir à jour si l'outil change.

## Captcha — Cloudflare Turnstile

- Créer un widget sur <https://dash.cloudflare.com/?to=/:account/turnstile> (domaine `grichard.eu`).
- Clé de **site** (publique) → `VITE_TURNSTILE_SITE_KEY` au moment du build (le build échoue sans elle).
- Clé **secrète** → `contact.config.php` (ou variable d'environnement `TURNSTILE_SECRET`).
- Le widget ne se charge que lorsque le formulaire approche de l'écran (`useTurnstile`). Un champ honeypot complète la protection.
- `contact.php` échoue en mode fermé : sans secret, aucun e-mail n'est envoyé.
- Côté interface, chaque cas a son message : captcha non validé ou refusé (403), trop de messages (429), script Turnstile
  injoignable, réseau coupé ou délai de 15 s dépassé, erreur serveur.

## Accessibilité

Lien d'évitement, focus visible (3 px), menu mobile avec `aria-expanded` (Échap le ferme et rend le focus à son bouton),
hiérarchie h1 → h2 → h3, `prefers-reduced-motion` respecté, contrastes ≥ WCAG AA (texte courant ≥ 7:1, boutons blancs sur
`emerald-700` ≈ 5,5:1). Dans le formulaire, les messages passent par une région live au rôle stable (`role="status"`),
et les champs sont en lecture seule (pas `disabled`) pendant l'envoi pour ne pas faire perdre le focus au clavier.
Le contrôle est automatisé : axe dans `tests/e2e`, règles `jsx-a11y` dans `npm run lint`.

## Sécurité

- **Secrets** : seule la clé *de site* Turnstile (publique) est dans le build. La clé secrète vit dans `contact.config.php`, ignoré par Git,
  placé au-dessus de la racine web ; `.htaccess` bloque aussi ce fichier, les sauvegardes (`.bak`, `~`…) et les fichiers cachés (`.git`, `.env`).
- **Formulaire** (`public/contact.php`) : Turnstile vérifié côté serveur (nom de domaine du jeton contrôlé), honeypot, contrôle de l'origine,
  nom et e-mail nettoyés contre l'injection d'en-têtes, aucune erreur PHP renvoyée.
- **Limitation d'envois** : 15 messages par heure au total et 3 par heure et par visiteur (un seul client ne peut pas épuiser
  le plafond global). Le compteur est un fichier temporaire manipulé sous un seul verrou (`flock`) : deux requêtes simultanées
  ne peuvent pas dépasser la limite. Il ne contient qu'une empreinte salée de l'IP, conservée au plus une heure ;
  les mentions légales (section 4) le précisent : à tenir à jour si ce mécanisme change.
- **En-têtes** : CSP sans `unsafe-inline` pour les scripts, HSTS, anti-clickjacking, `nosniff`, Referrer-Policy, Permissions-Policy.
  `style-src` garde `'unsafe-inline'` par prudence (comportement du widget Turnstile, non vérifiable hors production) :
  à retirer seulement après un essai sur le vrai site.
- **Contenu** : les articles Markdown sont de confiance (rendus tels quels, `marked` n'assainit pas le HTML) ; n'y collez jamais de HTML
  d'origine inconnue. La CSP (aucun script en ligne) limite l'impact d'une erreur.
- **Contact sécurité** : `/.well-known/security.txt` (champ `Expires` à renouveler avant le 30 septembre 2027).
- Contrôle régulier : `npm audit` (exécuté aussi par la CI).
