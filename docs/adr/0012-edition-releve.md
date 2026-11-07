# ADR 0012 : « édition relevé » (portfolio d'abord, dessin technique)

**Statut** : accepté (7 novembre 2026). Prolonge l'[ADR 0011](0011-identite-atelier.md) : polices, couleurs et tokens sont inchangés ; la composition des pages change. Maquette validée par Guillaume avant le développement.

## Décisions

- **Ordre de l'accueil** : portfolio d'abord (portrait et nom, réalisations, profil), puis le blog, puis les outils, puis le contact. Quatre parties numérotées en contour (01 à 04) : la numérotation encode un ordre de lecture réel. Le terminal reste, sous les outils.
- **Portrait** : l'avatar dessiné (inchangé dans son principe, barbe et cheveux en aplat uniforme) sur un disque d'accent, légendes tracées comme une vue technique. Les légendes sont décoratives et masquées aux lecteurs d'écran.
- **Registre daté** (blog, accueil, outils, articles liés) à la place des grilles de cartes : date et rubrique, titre, flèche. Une barre de répartition par rubrique (SVG, sans style en ligne) et des compteurs sur les puces.
- **Frise du parcours à l'échelle** : calculée au build depuis `profile.ts` (dates des postes, années entre parenthèses de la formation).
- **Schémas au trait** par réalisation mise en avant (`ProjectArt.astro`).
- **Icônes dessinées** (`Icon.astro`) et liens de profil en icônes seules (`SocialLinks.astro`), nom accessible par `aria-label`. Seuls les deux CV portent le code de langue (FR, EN) pour se distinguer.
- **Liens dans le texte** : encre pleine, soulignement d'accent de 2 px, fond teinté au survol.
- **Bandeau de cookies** : premier dans le DOM (ordre de Tab), affiché en dernier (`order`) et collé en bas (`position: sticky`). L'ancien `body:has(.consent) { padding-bottom: 12rem }` créait un vide sous le pied de page : supprimé. Signature du pied de page en SVG ajusté à la largeur, jamais coupée.
- **Espacement du blog** : une seule hiérarchie verticale de 48 px entre filtres, registre, outils liés et tags.

## Pièges rencontrés

- `.band` redéfinit `--accent` (ambre vif) : ne pas l'utiliser pour un aplat d'accent (contraste insuffisant en thème clair). Le contact utilise `.hm-contact`.
- Un `<title>` dans un SVG de page entre en collision avec le contrôle du titre de page (`dist.test.ts`) : pas de `<title>` dans les SVG décoratifs.
- `ul[role='list']` (0,1,1) l'emporte sur une classe seule : doubler le sélecteur pour poser une marge.

## Suite possible

- Retirer le CSS de l'ancien accueil (`.hero`, `.site-index`, `.ports`, `.bento`, `.band-peek`, `.home-split`) une fois la nouvelle page éprouvée en production.
