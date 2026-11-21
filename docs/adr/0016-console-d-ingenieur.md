# ADR 0016 : « console d'ingénieur », thème sombre sobre

**Statut** : accepté (21 novembre 2026). Remplace les [ADR 0014](0014-carnet-d-interventions.md) et [0015](0015-fusion-inkfolio.md) pour l'apparence (la structure des pages de l'[ADR 0012](0012-edition-releve.md) et l'[ADR 0009](0009-architecture-information-portfolio.md) restent).

## Contexte

Guillaume veut une identité sobre, premium, à personnalité technique : base sombre minimaliste (inspirée d'Astro Developer Theme, sans reprise de code, licence introuvable), structure d'Astrofy (idées seulement) et touche terminal dosée. Le « carnet » (feuille, marge, tampons, curseur) est abandonné.

## Décisions

- **Sombre par défaut**, avec ou sans JavaScript, quel que soit le système ; clair = choix explicite (`localStorage` `theme=light|auto`), réglages dans le pied de page, pas de bouton dans l'en-tête. `<html data-theme="dark">` est posé statiquement ; `/js/theme.js` l'ajuste avant le premier rendu.
- **Jetons** (`packages/ui/src/tokens.css`) : fond `#0f1115`, surfaces `#151820` / `#1b1f29`, filet `#262b36`, texte `#e8eaee`, accent violet `#a78bfa` (clair `#6d3fd6`), choisi par Guillaume : ni orange ni vert pour boutons et curseur ; secondaire rare bleu acier `#7fa6d6` (`--pen`). Clair : fond `#fafaf7`. Noms de jetons conservés (migration progressive) ; contrastes testés.
- **Polices** : Geist (variable) et IBM Plex Mono, auto-hébergées (OFL). Newsreader retirée.
- **Formes** : rayons 6 / 10 / 14 px, filets 1 px, aucune ombre sauf palette et modales. Liens soulignés d'un trait fin violet (plus d'ondulation). `.stamp` devient un badge en pilule.
- **Mouvement** : 120 / 200 / 320 ms, neutralisé par `prefers-reduced-motion`.
- **À retirer aux lots suivants** : curseur Windows (`cursor.css`), marge/perforations (fait en CSS au lot 1, balisage au lot 2), bandeau d'en-tête « carnet », références `GR-Rxx`.
- Interdits : dégradés omniprésents, halos, glassmorphism, néon, violet/cyan.
