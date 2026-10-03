# Portfolio — Guillaume Richard

Site personnel bilingue (FR/EN) : React 19 + Vite + Tailwind CSS 4, hébergé sur OVH (mutualisé, Apache + PHP).
Production : <https://grichard.eu>

## Architecture

```
index.html              Gabarit de développement uniquement (le HTML de production est généré par le pré-rendu)
src/
  data/content.js       TOUT le contenu (FR/EN), liens, mentions légales, chemins par langue (LANGS)
  components/           Header, SectionHeading, ContactForm (Turnstile), Shell (gabarit des pages statiques),
                        Blog, LegalPage, NotFound, Icons
  App.jsx               Accueil ; la langue vient de l'URL ('/' = FR, '/en/' = EN), pas d'un état
  main.jsx              Hydratation (langue et articles lus dans le HTML pré-rendu)
  index.css             Tailwind, focus visible, skip-link, styles des articles et du bandeau de cookies
content/blog/*.md      Articles (front matter : title, description, date, updated optionnel, script optionnel ; slug = nom du fichier)
scripts/prerender.js   Génère : accueil FR et EN, mentions légales, blog, 404.html, sitemap.xml (avec hreflang) et llms.txt
public/                 Copié tel quel dans dist/ : contact.php, .htaccess, robots.txt, llms.txt, og-image.png, PDF, favicon
public/js/             Scripts autonomes : consent.js (bandeau + Google Analytics), table-filter.js, 404.js
```

Pages produites : `/`, `/en/`, `/mentions-legales/`, `/en/legal-notice/`, `/blog/`, `/blog/<slug>/`, `404.html`.
Le sitemap n'est pas à maintenir à la main : il est entièrement généré au build.

## Développement

```bash
npm install
cp .env.example .env.local   # renseigner VITE_TURNSTILE_SITE_KEY
npm run dev                  # http://localhost:5173 (gabarit de dev : pas de blog, pas de /en/)
npm run lint
npm run build                # génère dist/ (build Vite + pré-rendu)
```

Pour ajouter un article : créer `content/blog/<slug>.md` avec son front matter, puis `npm run build`.

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
- Clé de **site** (publique) → `VITE_TURNSTILE_SITE_KEY` au moment du build.
- Clé **secrète** → `contact.config.php` (ou variable d'environnement `TURNSTILE_SECRET`).
- Le widget ne se charge que lorsque le formulaire approche de l'écran. Un champ honeypot complète la protection.
- `contact.php` échoue en mode fermé : sans secret, aucun e-mail n'est envoyé.

## Accessibilité

Lien d'évitement, focus visible (3 px), menu mobile avec `aria-expanded`, hiérarchie h1 → h2 → h3, messages de formulaire dans une région live,
`prefers-reduced-motion` respecté, contrastes ≥ WCAG AA (texte courant ≥ 7:1, boutons blancs sur `emerald-700` ≈ 5,5:1).
