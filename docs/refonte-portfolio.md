# Refonte « portfolio » de grichard.eu : audit et proposition

**Statut : proposition validée (choix délégués à l'assistant), phase 2 en cours.**
Ce document couvre la phase 0 (audit) et la phase 1 (proposition). La phase 2 ne démarre qu'après validation, et après réponse aux [questions ouvertes](#7-questions-ouvertes-à-trancher-avant-la-phase-2).

## 1. Audit de l'existant

### 1.1 Inventaire

| Élément             | État actuel                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pages « portfolio » | Accueil, À propos, Compétences, Projets, Contact (FR + EN, un seul gabarit `Simple.astro` pour les quatre dernières)                                                                                                           |
| Prolongements       | Blog (14 articles : 7 FR + 7 EN, 5 catégories), 12 outils, 8 références (FR seulement), portail client (hors `apps/web`)                                                                                                       |
| Pages légales       | Mentions légales, confidentialité, accessibilité (FR + EN)                                                                                                                                                                     |
| Contrat d'URL       | **84 entrées** (pas 70 : 71 URL d'origine + 4 outils + 8 références + index JSON). `notFound` : `/page-inexistante-contrat/`                                                                                                   |
| Données             | `apps/web/src/data/content.ts` (FR/EN : 6 domaines de compétences, 4 expériences, 8 projets, 2 formations, mentions légales) ; `pages.ts` (confidentialité, accessibilité)                                                     |
| Design system       | `packages/ui` : tokens, `base.css`, `components.css`, 7 composants Astro (Button, Card, Eyebrow, Kbd, SkipLink, Tag, ThemeSwitch). Les composants propres au site (en-tête, pied, cartes…) sont dans `apps/web/src/components` |
| Navigation          | 7 liens à plat dans l'en-tête (À propos, Compétences, Projets, Blog, Outils, Contact, Référence) + langue + thème ; pied de page sur une ligne ; fil d'Ariane seulement sur le blog et les outils                              |
| Scripts             | `nav.js` (menu mobile), `theme.js`, `consent.js`, `cursor.js`, `reference.js`, `table-filter.js`                                                                                                                               |
| ADR                 | 0001 à 0008 ; l'identité visuelle est décrite par l'ADR 0005                                                                                                                                                                   |

### 1.2 Identité visuelle à conserver (état réel)

Les **tokens font foi**, pas l'ADR 0005. L'ADR décrit encore une palette « vert signal » sur fond bleuté ; `packages/ui/src/tokens.css` définit aujourd'hui :

- sombre : fond `#130f16`, accent corail `#ff9270`, accent secondaire violet `#c4a1ff` ;
- clair : fond `#fbf6f0`, accent `#b23a0a`, secondaire `#6d28d9` ;
- Fraunces (titres), Inter (texte), JetBrains Mono (métadonnées), cartes à bordure fine, grille discrète en arrière-plan des en-têtes de page, terminal interactif, curseur animé.

La refonte reprend exactement cela. L'ADR 0005 sera corrigé (dérive de documentation, pas de décision nouvelle).

### 1.3 Scores de départ (mesurés le 14 octobre 2026)

Build local de `main` servi en HTTP local (sans compression ni cache, donc LCP plus lent qu'en ligne), Lighthouse 13.5 avec `chrome-headless-shell`, comme dans l'[audit du 9 octobre](audit/2026-10-apres.md).

| Page          | Mobile (Perf / Access. / Bonnes prat. / SEO) | Desktop               | CLS mobile / desktop |
| ------------- | -------------------------------------------- | --------------------- | -------------------- |
| `/`           | 96 / 100 / 100 / 100                         | 98 / 100 / 100 / 100  | 0,004 / **0,085**    |
| `/a-propos/`  | 99 / 100 / 100 / 100                         | 100 / 100 / 100 / 100 | 0,022 / 0,017        |
| `/projets/`   | 98 / 100 / 100 / 100                         | 100 / 100 / 100 / 100 | 0,012 / 0,017        |
| `/blog/`      | 99 / 100 / 100 / 100                         | 100 / 100 / 100 / 100 | 0,004 / 0,041        |
| `/outils/`    | 98 / 100 / 100 / 100                         | 100 / 100 / 100 / 100 | 0,001 / 0,009        |
| `/reference/` | 95 / 100 / 100 / 100                         | 100 / 100 / 100 / 100 | 0,001 / 0,008        |
| `/contact/`   | 95 / 100 / 100 / 100                         | 100 / 100 / 100 / 100 | 0,002 / 0,004        |

Le critère « aucune régression » s'apprécie par rapport à ce tableau. **À investiguer en phase 2** : le CLS desktop de l'accueil (0,085) est plus haut que les 0,006 mesurés en ligne le 9 octobre. Cause probable : le terminal ou le chargement des polices en local ; à confirmer en ligne avant de toucher à l'accueil.

**axe-core (WCAG 2.2 A/AA)** : 17 pages (FR et EN) × 3 largeurs (1440, 768, 375) × 2 thèmes = **102 combinaisons, 0 violation**, un seul `h1` partout, aucun défilement horizontal. Détail : [2026-10-refonte-avant-axe.json](audit/2026-10-refonte-avant-axe.json).

**Captures de référence** (1440 / 768 / 375, clair et sombre pour l'accueil ; sombre pour les autres, clair en 1440) : [captures/refonte-avant/](audit/captures/refonte-avant/).

### 1.4 Constats UX et architecture d'information

| #   | Gravité   | Constat                                                                                                                                                                                                                                                                      |
| --- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Important | **L'accueil est un fourre-tout** : 5 170 px en desktop, **9 789 px sur mobile**. Il contient les projets, les compétences, les expériences complètes, les outils (avec un paragraphe d'intro de 60 mots), le blog et le contact. Outils et blog pèsent autant que le profil. |
| 2   | Important | **Doublons de contenu** : les expériences figurent en entier sur l'accueil et sur `/a-propos/` ; les cartes de compétences sur l'accueil et sur `/competences/`. Aucune page n'a un rôle propre.                                                                             |
| 3   | Important | **Pas de page de détail pour un projet** : les 8 projets sont des cartes de 2 à 3 lignes, sans contexte, rôle, stack détaillée ni résultat. Un recruteur ne peut pas juger la profondeur du travail. Un seul projet a un lien (GitHub).                                      |
| 4   | Important | **Navigation à plat sans hiérarchie** : 7 liens de même poids, « Référence » ajouté en dernier et masqué en anglais, « Contact » n'est pas distingué comme appel à l'action. Pas de sous-navigation par section.                                                             |
| 5   | Moyen     | **Bug de lien** : sur l'accueil, « Voir le détail → » sous les compétences pointe vers `/a-propos/`, pas vers `/competences/`.                                                                                                                                               |
| 6   | Moyen     | **Pied de page** : une seule rangée de 8 éléments (légal, flux RSS, réseaux, interrupteur de curseur, cookies) sans regroupement ; aucun accès au plan du site, au CV, à la Référence.                                                                                       |
| 7   | Moyen     | **Pas de fil d'Ariane** sur les pages portfolio, alors qu'il existe sur le blog et les outils.                                                                                                                                                                               |
| 8   | Moyen     | **Hiérarchie des titres** : sur l'accueil, le `h2` « Expériences Professionnelles » et le `h3` du premier poste ont presque la même taille et aucun espace entre eux ; les descriptions de poste sont des blocs de 4 à 5 lignes sans structure.                              |
| 9   | Moyen     | **Grilles orphelines** : 6 cartes de compétences sur 4 colonnes (2 + 4), 8 projets sur 3 colonnes (2 cartes sur la dernière rangée).                                                                                                                                         |
| 10  | Moyen     | **Redondance du hero** : le métier apparaît deux fois (pastille « Laval · métier » puis sous-titre).                                                                                                                                                                         |
| 11  | Moyen     | **SEO des pages portfolio** : `/projets/` a pour description la liste des titres des cartes ; `/a-propos/` la coupe du texte à 160 caractères ; aucun nœud JSON-LD propre à chaque page, ni `BreadcrumbList` hors blog et outils.                                            |
| 12  | Moyen     | **Parité FR/EN imparfaite** : l'expérience « AlloVoisin / Particuliers » devient « Private Individuals » en anglais (AlloVoisin disparaît) ; la section Référence n'existe qu'en français.                                                                                   |
| 13  | Faible    | **Mobile** : en-tête compact (menu replié) mais l'accueil enchaîne 7 sections ; aucun repère de position (pas de lien vers l'ancre, pas de retour en haut).                                                                                                                  |
| 14  | Faible    | **Documentation** : l'ADR 0005 décrit une palette qui n'est plus celle du site.                                                                                                                                                                                              |

Points solides à ne pas casser : accessibilité (axe vert, cibles de 44 px, lien d'évitement, focus), thèmes sans flash, performances, bilinguisme avec `hreflang`, terminal accessible et désactivable, contrat d'URL.

### 1.5 Contrainte de contenu à connaître avant d'aller plus loin

Le contenu existant est **court** : 8 projets de 2 à 3 phrases, 4 expériences, 6 domaines de compétences. La demande (« une page détaillée par projet : contexte, rôle, stack, résultats ») suppose du contenu que le dépôt ne contient pas. **Je n'inventerai ni contexte, ni chiffre, ni résultat.** La proposition ci-dessous tient compte de cette limite (voir §3.3 et la question 1).

## 2. Principes

1. **Additif d'abord** : les nouvelles pages s'ajoutent ; les pages existantes changent de rôle, pas d'adresse. Seule exception, voulue : « Référence » devient « Cheatsheets » (301).
2. **Une page = un rôle** : l'accueil oriente, les pages de section approfondissent. Plus de contenu en double.
3. **Même identité** : uniquement les tokens existants. Les nouveaux composants sont des assemblages de tokens (aucune couleur, aucune police nouvelle).
4. **Blog, outils, référence = prolongements** : réunis sous une section « Ressources », présentés comme la suite du portfolio.
5. **Rien d'inachevé n'est visible** : une page n'est liée qu'une fois complète.

## 3. Architecture de l'information

### 3.1 Plan du site cible

```
Accueil                          /                    /en/                    (existant)
├─ À propos                      /a-propos/           /en/about/              (existant, recentré sur le profil)
├─ Parcours                      /parcours/           /en/career/             NOUVEAU
├─ Compétences                   /competences/        /en/skills/             (existant, enrichi)
├─ Réalisations                  /projets/            /en/projects/           (existant, devient liste filtrable)
│   └─ Une page par réalisation  /projets/<slug>/     /en/projects/<slug>/    NOUVEAU (8)
├─ Ressources                    /ressources/         /en/resources/          NOUVEAU (page d'orientation)
│   ├─ Blog                      /blog/               /en/blog/               (existant, inchangé)
│   ├─ Outils                    /outils/             /en/tools/              (existant, inchangé)
│   └─ Cheatsheets               /cheatsheets/       (FR seulement)          RENOMMÉ (ex-/reference/, 301)
├─ Contact                       /contact/            /en/contact/            (existant)
└─ Légal : mentions, confidentialité, accessibilité                           (existants)
```

| Page                 | Rôle                                                                                                                              | Contenu repris de l'existant                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Accueil              | Dire en 10 secondes qui je suis, ce que je fais, et orienter vers la bonne page                                                   | Pitch, 3 réalisations phares, 6 domaines en version compacte, parcours résumé, ressources, contact |
| À propos             | Le profil humain : qui, comment je travaille, ce qui m'anime                                                                      | Paragraphe « À propos », langues, CV (PDF)                                                         |
| Parcours             | Le CV en ligne : expériences, formation, langues, téléchargement des deux PDF                                                     | 4 expériences, 2 formations, langues, 2 PDF                                                        |
| Compétences          | Les 6 domaines en détail, chacun relié à ses preuves (réalisations, articles, outils, références)                                 | 6 domaines + liens vers le contenu existant                                                        |
| Réalisations         | Vue d'ensemble filtrable par domaine                                                                                              | 8 projets                                                                                          |
| Réalisation (détail) | Contexte, rôle, stack, déroulé, résultat, liens                                                                                   | Texte existant de la carte + sections complétées par Guillaume                                     |
| Ressources           | Présenter blog, outils et cheatsheets comme le prolongement du métier, avec les 3 derniers articles et les outils les plus utiles | Introduction des outils, derniers articles                                                         |
| Contact              | Joindre Guillaume : e-mail, formulaire, CV, réseaux                                                                               | Inchangé                                                                                           |

### 3.2 Services : à décider

« Services » n'a **aucun contenu source** dans le dépôt (pas de prestation, tarif, ni périmètre rédigés). Plutôt que d'en fabriquer, je propose de ne pas créer la page dans la première livraison. Les compétences reformulées sous l'angle « ce que je peux faire pour vous » (§3.4) couvrent le besoin d'un client potentiel. Si vous voulez une page Services, il me faut vos prestations (voir question 2).

### 3.3 Pages de réalisation : ce qui est réaliste

Gabarit en cinq blocs : **Contexte · Mon rôle · Stack · Déroulé · Résultat**, plus liens (GitHub, article lié, outil lié).

- Sont alimentés dès le départ : titre, résumé (texte actuel de la carte), stack (étiquettes actuelles), domaine de compétence, liens vers les articles, outils et références liés (ex. « Migrations de comptes » → article migration M365/Workspace, outil DNS Lookup, référence PowerShell M365).
- Les blocs Contexte, Rôle, Déroulé, Résultat sont **facultatifs dans le schéma** : un bloc vide n'est pas affiché. Guillaume les remplit au fur et à mesure (en FR et EN). Aucune page n'est publiée avant d'avoir au moins un bloc réel en plus du résumé.
- Contrainte à garder en tête : certains projets sont des missions pour des clients ; les noms et chiffres restent à votre discrétion.

### 3.4 Compétences reliées aux preuves

Chaque domaine affiche : description actuelle, réalisations associées, articles du blog de la même thématique, outils et références pertinents. Correspondance proposée (liens déjà existants, rien à écrire) :

| Domaine                        | Réalisations                                      | Blog                                     | Outils / Référence                                                                    |
| ------------------------------ | ------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Réseau & Systèmes              | Homelab, Windows Server (MDT, WDS)                | BIOS/UEFI                                | Calculateur réseau ; réf. Active Directory, Réseau, Linux/Proxmox, Événements Windows |
| Sécurité IT                    | Homelab (OPNsense, WireGuard)                     | Sécuriser M365/Workspace, SPF/DKIM/DMARC | Générateur de mot de passe, en-têtes e-mail                                           |
| Messagerie & Cloud             | Migrations de comptes                             | Migration, délivrabilité, DNS, SPF/DKIM  | DNS Lookup, propagation DNS ; réf. PowerShell M365, GAM                               |
| Formation IA, M365 & RGPD      | (à compléter)                                     | (à compléter)                            | —                                                                                     |
| Développement & Automatisation | Outil MSG/EML → PDF, Automatisation, Création Web | —                                        | Les 12 outils du site, réf. Git                                                       |
| Support & Projets IT           | Support N1 à N3, PC sur mesure                    | Windows 10 → 11                          | Réf. Windows 11                                                                       |

### 3.5 Navigation

**Menu principal : 5 entrées + 1 appel à l'action.**

`À propos · Parcours · Compétences · Réalisations · Ressources · [Contact]`

- « Contact » devient un bouton plein (style `Button primary`), **toujours visible**, y compris dans le menu mobile replié (à côté du bouton Menu) ; il remplace l'entrée de texte.
- « Ressources » regroupe Blog, Outils, Cheatsheets. Pas de menu déroulant : un menu au survol est piégeux au clavier et au tactile. À la place, une **sous-navigation de section** s'affiche sous l'en-tête sur les pages de la section (Ressources · Blog · Outils · Cheatsheets), avec `aria-current`. Même mécanisme pour « Réalisations » (filtre par domaine) si utile.
- Page courante : `aria-current="page"` sur l'entrée, et sur la section parente (ex. un article de blog allume « Ressources »).
- Sélecteur de langue et de thème conservés, accessibles au clavier comme aujourd'hui.
- Menu mobile : mécanisme actuel (`nav.js`, panneau dans le flux, Échap) conservé ; aucune nouvelle dépendance.

**Fil d'Ariane** sur toutes les pages sauf l'accueil : `Accueil › Réalisations › Migrations de comptes`, avec `BreadcrumbList` JSON-LD (réutilise `breadcrumbLd`).

**Pied de page structuré**, 4 colonnes en desktop, empilées en mobile :

| Profil                                        | Ressources                          | Contact                                           | Informations                                                             |
| --------------------------------------------- | ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| À propos, Parcours, Compétences, Réalisations | Blog, Outils, Cheatsheets, Flux RSS | E-mail, formulaire, LinkedIn, GitHub, CV (FR, EN) | Mentions légales, confidentialité, accessibilité, cookies, curseur animé |

**Recherche** : pas de nouveau moteur. Elle existe déjà par la palette de commandes (terminal, `Ctrl + K`) et la recherche des Cheatsheets. On expose l'entrée de recherche de la palette dans l'en-tête (bouton « Rechercher ») plutôt que d'ajouter un index.

### 3.6 Page d'accueil

Ordre des sections, chacune avec un lien « tout voir » :

1. **Hero** : accroche, métier (une seule fois), 2 CTA (Voir les réalisations, Me contacter) et CV en lien secondaire ; terminal conservé à droite (identité).
2. **Compétences clés** : les 6 domaines en grille régulière (3 × 2), une ligne chacun, lien vers `/competences/`. Corrige le lien erroné.
3. **Réalisations phares** : 3 cartes (au lieu de 6), lien vers la liste.
4. **Parcours en bref** : 4 lignes (poste · structure · date), lien vers `/parcours/`. Les descriptions longues quittent l'accueil.
5. **Ressources** : 3 cartes (Blog avec le dernier article, Outils avec 3 outils, Cheatsheets), présentées comme le prolongement du métier.
6. **Contact** : bandeau avec e-mail, bouton, CV.

Effet attendu : accueil réduit d'environ 40 % en hauteur, sans perte de contenu (tout se retrouve sur sa page, voir §4).

### 3.7 Parcours visiteur

| Visiteur                           | Objectif                                    | Chemin le plus court                                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Recruteur**                      | Juger le profil, récupérer le CV            | Accueil → bouton CV (1 clic) ; ou Parcours (1 clic) → deux PDF ; Réalisations → détail pour juger la profondeur                                                                      |
| **Client potentiel**               | Savoir si je résous son problème, contacter | Accueil → Compétences (domaine concerné + preuves) → **Contact** (bouton toujours visible : 2 clics maximum)                                                                         |
| **Lecteur / utilisateur d'outils** | Résoudre un problème précis                 | Arrivée directe sur l'article ou l'outil (moteur de recherche) → sous-navigation Ressources pour passer du blog à l'outil ou à la référence ; depuis l'accueil, Ressources en 1 clic |

## 4. Tableau de correspondance « ancien contenu → nouvel emplacement »

| Ancien contenu                                          | Ancien emplacement                  | Nouvel emplacement                                                                   |
| ------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| Accroche (pitch) et rôle                                | Accueil (hero)                      | Accueil (hero) ; reprise dans À propos                                               |
| Terminal interactif                                     | Accueil (hero)                      | Accueil (hero), inchangé                                                             |
| Paragraphe « À propos de moi »                          | `/a-propos/`, résumé en description | `/a-propos/` (recentrée), meta description rédigée                                   |
| 4 expériences professionnelles (texte intégral)         | Accueil et `/a-propos/`             | `/parcours/` (texte intégral) ; accueil : 4 lignes de résumé                         |
| Formation (2 diplômes) et langues                       | `/a-propos/`                        | `/parcours/`                                                                         |
| CV FR et Resume EN (PDF)                                | Accueil, `/a-propos/`, `/contact/`  | Accueil, `/parcours/`, `/contact/`, pied de page ; URL des PDF inchangées            |
| 6 domaines de compétences                               | Accueil et `/competences/`          | `/competences/` (texte intégral + preuves) ; accueil : version compacte              |
| 8 projets (titre, description, étiquettes, lien GitHub) | Accueil (6) et `/projets/` (8)      | `/projets/` (liste) + `/projets/<slug>/` (8 pages) ; accueil : 3 réalisations phares |
| Section Outils (intro + 4 cartes)                       | Accueil                             | `/ressources/` (présentation) ; `/outils/` inchangé ; accueil : carte Outils         |
| Derniers articles                                       | Accueil                             | `/ressources/` ; accueil : dernier article dans la carte Blog                        |
| Blog (14 articles, catégories, tags, RSS)               | `/blog/…`, `/en/blog/…`             | Inchangé (URL identiques)                                                            |
| 12 outils                                               | `/outils/…`, `/en/tools/…`          | Inchangé                                                                             |
| 8 références (aide-mémoire)                             | `/reference/…`                      | `/cheatsheets/…` (301 depuis l'ancienne URL)                                         |
| Contact (e-mail, formulaire)                            | `/contact/`, accueil                | `/contact/` inchangé ; bandeau de contact sur l'accueil                              |
| Mentions légales, confidentialité, accessibilité        | Pied de page                        | Inchangés, regroupés dans la colonne « Informations »                                |
| `llms.txt`, `ai-catalog.json`, sitemap, flux RSS        | Racine                              | Mis à jour avec les nouvelles pages                                                  |

À corriger au passage (parité) : l'expérience « AlloVoisin / Particuliers » de la version anglaise reprend le nom AlloVoisin.

## 5. Plan de migration des URL

**Une seule section change d'adresse, à votre demande : « Référence » devient « Cheatsheets »** (libellé et URL, en français comme en anglais). Toutes les autres URL restent identiques. Il y a donc **9 redirections 301** à créer ; le reste du contrat (84 entrées) doit rester vert à chaque étape.

| Ancienne URL                                                                                                                             | Nouvelle URL          | Action                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------- |
| `/`, `/en/`                                                                                                                              | identiques            | Contenu réorganisé                                                  |
| `/a-propos/`, `/en/about/`                                                                                                               | identiques            | Contenu recentré (expériences et formation déplacées vers Parcours) |
| `/competences/`, `/en/skills/`                                                                                                           | identiques            | Enrichi                                                             |
| `/projets/`, `/en/projects/`                                                                                                             | identiques            | Liste + filtre                                                      |
| `/contact/`, `/en/contact/`                                                                                                              | identiques            | Inchangé                                                            |
| `/reference/`                                                                                                                            | `/cheatsheets/`       | **301**                                                             |
| `/reference/<réf>/` × 8 (gam, powershell-m365, windows-11, active-directory, reseau, linux-proxmox, git-claude-code, evenements-windows) | `/cheatsheets/<réf>/` | **301** (même slug)                                                 |
| tout `/blog/…`, `/outils/…`, PDF, flux                                                                                                   | identiques            | Inchangé                                                            |

**Nouvelles URL à ajouter au contrat** (`tests/contract/contract.json`), au fur et à mesure de leur publication :

- `/parcours/`, `/en/career/`
- `/ressources/`, `/en/resources/`
- `/projets/<slug>/` × 8 et `/en/projects/<slug>/` × 8 (slugs courts, par exemple `homelab-proxmox-opnsense`, `deploiement-windows-server`, `migrations-messagerie`, `support-n1-n3`, `pc-sur-mesure`, `convertisseur-msg-eml`, `automatisation-scripts`, `creation-web`).

**Redirections (Cheatsheets).** Le contrat est mis à jour dans le même commit : les 9 entrées `/reference/…` deviennent `/cheatsheets/…`, et on ajoute un contrôle des 301 (ancienne URL → nouvelle). Les liens internes, le sitemap, `llms.txt`, `ai-catalog.json` et les tests pointent vers les nouvelles URL. Le fichier de données `/data/reference/index.json` n'est pas une page : son chemin reste inchangé. Il n'existe pas de `/en/reference/` en ligne (aucune référence en anglais) : rien à rediriger. **`htaccess.mjs` ne sait aujourd'hui produire aucune redirection de page : ce renommage impose donc d'abord d'y ajouter une table de redirections** (`RewriteRule … [R=301,L]`, sans toucher à la CSP ni aux règles existantes), testée par `htaccess.test.ts`. Je déconseille de renommer d'autres URL (`/projets/` → `/realisations/` par exemple) : gain SEO nul, risque réel.

## 6. Découpage en étapes atomiques

Chaque étape : commit Conventional Commits en français, `pnpm verify` vert, push, contrat vérifié en ligne. Les pages nouvelles restent **non liées** jusqu'à l'étape 9.

| #   | Étape                                                                                                                                                                                                                                                    | Visible en ligne ?                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 0   | Docs : ce document, captures et scores « avant », correction de l'ADR 0005, nouvel ADR 0009 (architecture d'information)                                                                                                                                 | Non                                 |
| 1   | Design system : composants `Breadcrumb`, `SectionNav`, `SectionHeader`, `ProjectCard`, `Timeline`, `CtaBand`, `FooterColumns` dans `packages/ui` (CSS à tokens), documentés dans `/design/`, testés (contraste, axe)                                     | Non (page de style hors production) |
| 2   | Modèle de données : projets avec `slug`, blocs facultatifs et liens liés ; compétences reliées aux preuves ; **test de parité FR/EN** (aucune clé manquante) ; correction AlloVoisin                                                                     | Non                                 |
| 3   | Page Parcours (FR + EN), non liée ; entrées au contrat                                                                                                                                                                                                   | URL active, non liée                |
| 4   | Pages de réalisation + liste filtrable (FR + EN), non liées ; entrées au contrat                                                                                                                                                                         | idem                                |
| 5   | Compétences enrichies (preuves liées)                                                                                                                                                                                                                    | Oui (page existante)                |
| 5b  | **Renommage Référence → Cheatsheets** : table de redirections dans `htaccess.mjs` (+ test), routes `/reference/` → `/cheatsheets/`, libellés FR/EN, liens internes, contrat (9 URL + contrôle des 301), `llms.txt`, docs (ADR 0008, `docs/reference.md`) | Oui (URL changée, 301 actives)      |
| 6   | Page Ressources (FR + EN) ; sous-navigation de section                                                                                                                                                                                                   | URL active, non liée                |
| 7   | À propos recentrée (les expériences ne sont retirées qu'une fois Parcours en ligne)                                                                                                                                                                      | Oui                                 |
| 8   | Nouvel accueil                                                                                                                                                                                                                                           | Oui                                 |
| 9   | **Bascule de la navigation** : nouvel en-tête (5 entrées + CTA), pied de page structuré, fil d'Ariane partout, adaptation des tests e2e (`site.spec.ts`)                                                                                                 | Oui                                 |
| 10  | SEO : `Person`/`ProfilePage` enrichis, `CreativeWork` pour les réalisations, `BreadcrumbList` partout, descriptions uniques, `llms.txt`, `ai-catalog.json`, sitemap                                                                                      | Oui                                 |
| 10b | **Passe éditoriale** (voir §Ton et style) : relecture et réécriture des textes de toutes les pages, FR et EN, par lots (portfolio, outils, blog, légal)                                                                                                  | Oui                                 |
| 11  | Clôture : audit « après » (Lighthouse, axe, captures), comparatif, `CLAUDE.md` et `AGENTS.md` synchronisés, résumé final                                                                                                                                 | Oui                                 |

Les étapes 3 à 6 peuvent changer d'ordre ; 9 et 10 viennent toujours après les pages qu'elles lient.

## 7. Questions ouvertes : réponses retenues

Guillaume a délégué ces choix (« fais au mieux, suis les standards »). Retenu, en appliquant les défauts de la proposition :

1. **Contenu des réalisations** : pages publiées avec les seuls éléments existants (résumé, stack, liens vers articles, outils et cheatsheets liés). Les blocs Contexte, Rôle, Déroulé et Résultat sont facultatifs et restent masqués tant qu'ils sont vides : rien n'est inventé.
2. **Page Services** : non (les compétences, reliées à leurs preuves, couvrent le besoin).
3. **Ressources** : regroupement Blog, Outils, Cheatsheets.
4. **Terminal** : conservé dans le hero.
5. **Textes** : réécrits dans le ton défini plus bas, faits inchangés ; Guillaume les relit après mise en ligne et peut demander des retouches.
6. **Slugs anglais** : `/en/career/` et `/en/resources/`.

## Décisions déjà prises

- **Terminal** : conservé dans le hero de l'accueil.
- **Référence** : renommée « Cheatsheets » en français et en anglais, URL comprise (`/cheatsheets/`), avec 301 depuis `/reference/…`.
- **Ton des textes** : plus humain et naturel sur toutes les pages ; la mention « traité dans votre navigateur » est limitée à une ou deux occurrences (voir ci-dessous).

## Ton et style des textes

**Constat.** Le site parle beaucoup de lui-même sur un registre de documentation (« Des outils gratuits pour techniciens et administrateurs… », listes de termes, phrases à rallonge). La précision sur le traitement local est répétée environ **70 fois** dans les textes des outils (FR + EN, introduction, bandeau de confidentialité, FAQ, messages d'erreur), en plus du hub et de la page de confidentialité.

**Règles proposées.**

1. **Voix** : « je » et « vous », phrases courtes, verbes concrets, ce que je fais et ce que ça vous apporte. Pas de jargon sans raison, pas de liste de sigles en guise de phrase, pas de formules creuses. Même ton en anglais (réécrit, pas traduit mot à mot).
2. **Rien d'inventé** : la réécriture change la forme, pas les faits (dates, employeurs, technos, chiffres). Les textes juridiques (mentions, confidentialité, accessibilité) restent exacts ; je les rends plus lisibles sans altérer le sens, et vous les relisez.
3. **« Dans le navigateur »** : dit **une fois dans la page d'accueil des outils** et **une fois dans la politique de confidentialité** (obligatoire). Sur les pages d'outils, la mention n'est gardée que là où la saisie est sensible (en-têtes d'e-mail, JWT, générateur de mot de passe), en une seule phrase par outil, sans la répéter dans la FAQ et les messages. Ailleurs (JSON, unités, calculateur réseau, ICS…), elle disparaît. Les outils DNS et SEO, qui contactent des services externes, gardent l'information utile (qui est interrogé), formulée simplement.
4. **Procédure** : un lot par type de page (portfolio, outils, blog, légal), relu par vous avant publication ; les articles du blog ne sont retouchés que pour l'introduction et les titres, sans réécrire le fond.

Exemple de la direction visée (accueil, accroche actuelle → proposée, à valider) :

> Avant : « Technicien informatique : réseau, systèmes, sécurité et messagerie (Microsoft 365, Google Workspace). Je déploie, je dépanne, j'accompagne les utilisateurs et je les forme à l'IA, à Microsoft 365 et au RGPD. »
>
> Après : « Je suis technicien informatique à Laval. Je m'occupe des réseaux, des postes et de la messagerie (Microsoft 365, Google Workspace) : je les installe, je les répare quand ça coince, et je prends le temps d'expliquer pour que vous soyez autonome. Je forme aussi à l'IA, à Microsoft 365 et au RGPD. »

## 8. Risques

| Risque                                                                             | Parade                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages de réalisation maigres (peu de contenu) : contenu mince, mauvais pour le SEO | Blocs facultatifs, pas de publication sans contenu réel, `noindex` possible tant qu'une page n'est pas étoffée                                                                                            |
| Contenu dupliqué entre accueil et pages de section                                 | Accueil limité à des résumés d'une ligne ; tableau §4 comme checklist de relecture                                                                                                                        |
| Rupture d'une URL publique (renommage Cheatsheets : 9 URL)                         | Seules les 9 URL Cheatsheets changent, avec 301 testées ; contrat vérifié avant chaque push et en ligne après déploiement                                                                                 |
| Régression de performance (CLS, poids)                                             | Mesure avant chaque étape visible ; investigation du CLS de l'accueil dès l'étape 8 ; aucune image ni police nouvelle ; pas de JS supplémentaire sauf filtre des réalisations (script externe, optionnel) |
| Régression d'accessibilité (nouvelle navigation, sous-navigation, filtre)          | axe dans les deux thèmes sur toutes les nouvelles pages ; test clavier du menu ; pas de menu au survol                                                                                                    |
| Tests e2e de navigation cassés par la bascule (étape 9)                            | Étape 9 dédiée, tests adaptés dans le même commit                                                                                                                                                         |
| Parité FR/EN dégradée (nouvelles pages)                                            | Test automatique de parité (étape 2) ; chaque page livrée dans les deux langues                                                                                                                           |
| Réécriture qui déforme un fait ou un texte juridique                               | Faits figés (voir règle 2), relecture par lots avant publication, textes légaux relus par vous                                                                                                            |
| Dérive visuelle                                                                    | Aucun nouveau token ; comparaison avec les captures de référence ; revue sur `/design/` avant usage                                                                                                       |
| Poussée directe en production                                                      | Étapes petites ; pages non liées jusqu'à l'étape 9 ; `git revert` immédiat en cas de souci                                                                                                                |

## 9. Critères de validation

Chaque étape et l'ensemble :

- `pnpm verify` : code de retour 0 (format, lint, types, tests, e2e + axe, build, contrat) ;
- axe : 0 violation, deux thèmes, 1440 / 768 / 375 px, sur les pages nouvelles et modifiées ;
- rendu vérifié en 1440 / 768 / 375 px, au clavier (menu, sous-navigation, filtre, langue, thème), thèmes clair et sombre ;
- Lighthouse : aucune baisse par rapport au §1.3, visé ≥ 95 sur les quatre catégories ; CLS ≤ 0,05 ;
- contrat : 84 entrées d'origine toujours vertes, nouvelles URL ajoutées ; `CONTRACT_BASE_URL=https://grichard.eu pnpm test:contract` vert après chaque déploiement ;
- une seule `h1` par page, métadonnées uniques, `hreflang` réciproques FR/EN, JSON-LD valide ;
- tableau de correspondance §4 coché : aucun contenu perdu ;
- livrables finaux : comparatif avant/après (captures, Lighthouse, axe), `CLAUDE.md` et `AGENTS.md` synchronisés, résumé « fait / reste / risques / à vérifier de votre côté ».

## 10. Actions qui vous reviendront

Aucune pour l'instant. Les actions DNS, secrets et réglages GitHub ne sont pas concernées par ce plan ; si une apparaît, elle vous sera proposée en étapes manuelles.
