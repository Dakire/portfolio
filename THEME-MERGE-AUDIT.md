# THEME-MERGE-AUDIT

Phase 1 (audit). Décisions de Guillaume : l'identité « carnet d'interventions » (ADR 0014/0015) est **remplacée** ; recherche = **Pagefind**.

## 1. Site existant (apps/web, Astro 7.4, Preact 11, statique FR/EN)

- **Pages** : `index`, `a-propos`, `parcours`, `competences`, `projets` + `projets/[slug]`, `blog` (+ `categorie/[category]`, `tag`), `outils`, `cheatsheets`, `contact`, `ressources`, pages légales ; miroir `en/`. 70 URL publiques verrouillées par `tests/contract/contract.json`.
- **Vues** (`src/views/`) : Home, Career, BlogIndex, Post, ProjectPage, ToolsHub, ReferenceHub... Composants dans `src/components/` (SiteHeader, SiteFooter, SearchDialog, Terminal, PostCard, ProjectCards...).
- **Données** : `src/data/profile.ts` (671 l., FR/EN, parité testée), `content.ts`, `related.ts`, `site-text.ts`, `pages.ts` ; blog en content collection (38 articles Markdown).
- **Design system** : `packages/ui/src/` (tokens 208 l., base 286, components 614, fonts, cursor). Thème via `data-theme` posé par `public/js/theme.js`.
- **Recherche actuelle** : `search.js` + `/search-index.json` (pages, articles, outils, cheatsheets), dialogue `<dialog>` natif, Ctrl+K. Les cheatsheets ont leur propre MiniSearch (`reference.js`, à conserver : tolérance aux fautes, glossaire).
- **Terminal actuel** : bloc sur l'accueil (`src/terminal/` : commands.ts pur et testé, data.ts, text.ts, ui.ts). Commandes : skills, experiences, projects, tools, posts, links, paths, theme, cursor... Pas de page `/terminal`.
- **Duplications / dette** : noms de commandes terminal divergents du brief (`experiences`/`posts` vs `experience`/`blog`) ; CSS « carnet » (feuille, marge, perforations, curseur Windows) à retirer ; ADR 0010-0015 empilées ; `dist-preprod` résiduel (préproduction interdite par CLAUDE.md).
- **Contraintes dures** : prod = statique + PHP (OVH FTP) ; CSP sans `unsafe-inline` (générée par `scripts/lib/htaccess.mjs`) ; pas de couleur en dur ; aucun `<style>`/script en ligne ; WCAG 2.2 AA ; push sur `main` = production (verify avant).
- **Données manquantes à ne pas inventer** : statut de disponibilité (aucun champ réel), captures d'aperçu des projets, dépôts publics par projet (`MSG-EML-To-PDF...` privé), activité GitHub.

## 2. Références (synthèse)

- **Astro Developer Theme (60 %)** : démo seule, ni dépôt ni licence trouvés → **inspiration visuelle uniquement, aucun code**. À reprendre : sombre neutre, filets 1 px, cartes sobres, Pagefind Ctrl/Cmd+K, grille de projets filtrable avec badge de statut, blog (tags, temps de lecture, liés, précédent/suivant), sommaire à suivi, 404 façon terminal. À éviter : accent violet générique. Valeurs observées : fond L≈15 %, carte L≈18,5 %, bordure L≈27 %, texte L≈92 %, rayons 6-16 px, transitions 0,2 s `cubic-bezier(.4,0,.2,1)`.
- **Astrofy (25 %, MIT)** : timeline CV, cartes projets, pagination, config unique. À éviter : DaisyUI/Tailwind (incompatible avec nos tokens), pas d'i18n, dépendances anciennes. Idées reprises, pas de code.
- **terminal-portfolio (15 %, MIT)** : config unique avec commandes personnalisées, données GitHub en JSON statique. À éviter : migration inachevée, terminal comme navigation unique (a11y, SEO, mobile), thèmes matrix/cyberpunk.
- Aucune des trois n'est portée : Tailwind/DaisyUI exclus. Licence MIT d'Astrofy et du terminal : attribution si du code est un jour repris (pour l'instant aucun).

## 3. Direction artistique « console d'ingénieur, sobre »

Sombre par défaut ; clair conservé comme variante explicite (accessibilité, impression) via `data-theme`, mêmes tokens.

**Palette (sombre)** : fond `--bg` #0f1115 (neutre légèrement bleuté) · surface `--surface` #151820 · surface élevée `--surface-2` #1b1f29 · bordure `--line` #262b36 / forte #353b49 · texte `--ink` #e8eaee · atténué `--ink-2` #9aa1af (≥ 4,5:1 vérifié par test).
**Accent distinctif** `--accent` ambre-orange #f08a3c (héritage du site, aucun violet/cyan) pour liens actifs, focus, statut, curseur. **Secondaire rare** `--sec` bleu acier #7fa6d6 (page courante, sélection). **Sémantiques** : succès #4cb782, alerte #e5b53d, erreur #e5645f, toujours avec un mot. **Code** : variables Shiki dérivées (chaînes ambre atténué, mots-clés bleu acier, commentaires `--ink-2`, nombres vert).
Clair : fond #fafaf7, surface #fff, texte #1b1d22, accent #b8530f (contraste ≥ 4,5:1).

**Polices** (auto-hébergées, fontsource) : sans **Geist Variable** (à valider dispo/poids ; repli Inter) ; mono **IBM Plex Mono** (déjà présente). Newsreader abandonnée.
**Échelle** (rapport ≈ 1,2) : 13 / 15 / 17 / 20 / 24 / 32 / 44 / 64 px ; interligne corps 1,65, titres 1,15 ; mono pour labels et prompts, sans capitales forcées.
**Espacements** : grille 4 px, section 64-96 px. **Rayons** : 6 / 10 / 14 px, pilule pour badges. **Ombres** : aucune sur cartes ; une ombre diffuse seulement pour palette de recherche et modales. **Durées** : 120 / 200 / 320 ms, `cubic-bezier(.2,.7,.2,1)`, tout neutralisé sous `prefers-reduced-motion`.
**Interdits** : dégradés omniprésents, halos, glassmorphism, néon, cyberpunk, violet/cyan.

## 4. Recherche : Pagefind

- Index statique au build (`pagefind --site dist` en `postbuild`), chargement paresseux à la première ouverture, zéro backend : compatible OVH.
- Filtres Pagefind par type (Pages / Projets / Articles / Compétences) et métadonnées (catégorie, tags) via `data-pagefind-*` ; accents/casse/préfixe natifs ; surlignage natif ; `data-pagefind-ignore` sur légales, 404, `/terminal` interne.
- UI = palette Preact maison (pas le widget par défaut) sur l'API JS de Pagefind ; `/search?q=` partageable.
- Points à traiter : (a) CSP : Pagefind charge un module JS et du WASM → `script-src 'wasm-unsafe-eval'` et `/pagefind/` en `'self'`, à ajouter dans `htaccess.mjs` + test ; (b) FR/EN : index par langue (`data-pagefind-filter="lang"`) ; (c) cheatsheets : laissées à leur MiniSearch, exclues de l'index global (milliers de pages) ; (d) ADR 0016 : Pagefind remplace `/search-index.json`, `search.js` supprimé après bascule.

## 5. Risques

1. **CLAUDE.md/AGENTS.md** imposent « thème clair par défaut », « aucun bouton de thème », vocabulaire carnet : à réécrire au lot 1 (ADR 0016 remplace 0014/0015). Tests e2e/contraste/dist à adapter (curseur, feuille).
2. **URL** : routes `/terminal/`, `/search/` nouvelles (FR + `/en/`) → contrat à étendre, sitemap, `llms.txt`. Aucune URL existante ne bouge ; blog/catégories/tags déjà en place.
3. **Brief vs existant** : « Expériences » et « Parcours » = même page ; menu actuel à plat (ADR 0009) à réconcilier avec la liste du brief (Accueil, À propos, Projets, Compétences, Expériences, Blog, Terminal, Contact) sans casser `/parcours/`. À trancher au lot 2.
4. **Blocs de code** : Shiki produit des `style=""` (ADR 0005) ; copie de code = petit script externe.
5. **View Transitions** + scripts classiques : ré-initialisation des îlots à gérer (événements `astro:page-load`).
6. **Mobile terminal** : clavier virtuel, `visualViewport`.
7. **Lighthouse ≥ 95** : polices variables auto-hébergées, 1 seule famille sans + mono subsettées.
8. Hébergement : Pagefind ajoute ~1 Mo de fichiers à déployer par FTP (acceptable, `pagefind/` regénéré à chaque build).
