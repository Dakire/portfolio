# Portfolio — Guillaume Richard

Site personnel bilingue (FR/EN) : React 19 + Vite + Tailwind CSS 4, hébergé sur OVH (mutualisé, Apache + PHP).
Production : <https://grichard.eu>

## Architecture

```
index.html              Meta SEO, Open Graph, Twitter Cards, JSON-LD (ProfilePage + Person), fallback <noscript>
src/
  data/content.js       TOUT le contenu (FR/EN), liens et mentions légales
  components/           Header (nav + menu mobile), SectionHeading, ContactForm (Turnstile), LegalPage, Icons
  App.jsx               Assemblage des sections
  index.css             Tailwind + focus visible, skip-link, prefers-reduced-motion
public/                 Copié tel quel dans dist/ : contact.php, .htaccess, robots.txt, sitemap.xml, llms.txt, PDF, favicon
```

## Développement

```bash
npm install
cp .env.example .env.local   # renseigner VITE_TURNSTILE_SITE_KEY
npm run dev                  # http://localhost:5173
npm run lint
npm run build                # génère dist/
```

## Déploiement (OVH)

1. `npm run build`, puis envoyer le contenu de `dist/` à la racine du site (y compris `.htaccess`).
2. Sur le serveur, créer `contact.config.php` à côté de `contact.php` (modèle : `contact.config.example.php`) avec la **clé secrète** Turnstile.
   Le fichier est ignoré par Git et bloqué à l'accès HTTP par `.htaccess`.

## Captcha — Cloudflare Turnstile

- Créer un widget sur <https://dash.cloudflare.com/?to=/:account/turnstile> (domaine `grichard.eu`).
- Clé de **site** (publique) → `VITE_TURNSTILE_SITE_KEY` au moment du build.
- Clé **secrète** → `contact.config.php` (ou variable d'environnement `TURNSTILE_SECRET`).
- Le widget ne se charge que lorsque le formulaire approche de l'écran. Un champ honeypot complète la protection.
- `contact.php` échoue en mode fermé : sans secret, aucun e-mail n'est envoyé.

## Accessibilité

Lien d'évitement, focus visible (3 px), menu mobile avec `aria-expanded`, hiérarchie h1 → h2 → h3, messages de formulaire dans une région live,
`prefers-reduced-motion` respecté, contrastes ≥ WCAG AA (texte courant ≥ 7:1, boutons blancs sur `emerald-700` ≈ 5,5:1).
