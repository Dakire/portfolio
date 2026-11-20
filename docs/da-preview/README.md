# Direction artistique proposée : « Carnet d'exploitation »

Statut : **proposition, en attente de validation** (STOP de la phase 1). Maquettes : [index.html](index.html) (accueil) et [article.html](article.html) (article), à ouvrir dans un navigateur ; elles suivent le thème du système. Les polices du site ne sont pas chargées dans la maquette (polices de repli).

## Principe et justification

Votre métier est l'exploitation : documenter, diagnostiquer, expliquer. La direction prend pour modèle un carnet d'exploitation (runbook) bien tenu : des sections numérotées, des dates et des mises à jour visibles, des marqueurs de gravité, des schémas au trait. Le site ressemble à ce que vous produisez, sans imiter un terminal ni un tableau de bord.

**C'est une évolution de l'identité actuelle (ADR 0013), pas une refonte.** Elle conserve la base qui fonctionne (encre chaude et papier, accent terracotta, polices actuelles, menu en liens nus, lignes de registre) et ajuste ce qui manque : un rythme plus varié entre les pages, des cartes moins arrondies, une typographie de lecture soignée pour le blog, et des éléments propres à votre contenu.

## Palette (contrastes WCAG calculés)

| Rôle                    | Clair     | Sombre    | Contraste vérifié                       |
| ----------------------- | --------- | --------- | --------------------------------------- |
| Fond                    | `#f6f2ea` | `#16130f` |                                         |
| Carte                   | `#ece4d6` | `#26211b` |                                         |
| Texte                   | `#1d1a16` | `#f1ebe0` | 15,5:1 / 15,6:1                         |
| Texte en sourdine       | `#5a5148` | `#b8ad9e` | 6,9:1 / 8,4:1                           |
| Accent (texte, boutons) | `#a8391a` | `#ff8a63` | 5,8:1 / 8,0:1 (5,1:1 / 6,9:1 sur carte) |
| Bordure de composant    | `#8a7f72` | `#7d7366` | 3,5:1 / 4,0:1 (seuil 3:1)               |
| Gravité : OK            | `#2f6b3a` | `#7fcf8c` | 5,7:1 / 9,9:1                           |
| Gravité : attention     | `#8a5a00` | `#e8b44a` | 5,3:1 / 9,8:1                           |
| Gravité : critique      | `#a3201f` | `#ff7b78` | 6,8:1 / 7,4:1                           |

Le clair passe de l'accent actuel à une terracotta plus foncée pour tenir 4,5:1 en texte. Seuls deux tons de carte, comme aujourd'hui. Les couleurs de gravité servent uniquement aux marqueurs d'articles, toujours avec un symbole et un mot.

## Typographie

Inchangée : Bricolage Grotesque (titres), Atkinson Hyperlegible Next (texte), JetBrains Mono (code, dates, numéros de section). Lecture d'article : 17 px, interligne 1,65, colonne de 68 caractères.

## Échelles

- **Espacements** : 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 112 px (tokens `--s1` à `--s9`).
- **Rayons** : 4 px (champs, code, boutons), 12 px (cartes), 20 px (grandes cartes d'accueil seulement). Fin des rayons de 28 px partout.
- **Bordures** : filets de 1 px pour structurer, pas d'ombres portées ; seul le focus a un contour de 3 px.
- **Animation** : couleurs et soulignements en 120 ms, rien d'autre ; neutralisé par `prefers-reduced-motion`.

## Trois éléments signature, justifiés par le contenu

1. **Marqueur de gravité** (`▲ Critique`, `● Attention`, `✓ Correctif disponible`) en tête des articles d'actualité sécurité : vos lecteurs cherchent d'abord « est-ce grave pour moi ? ». Symbole + texte, jamais la couleur seule.
2. **Numérotation de section « § n » en marge** et **journal des modifications** visible en fin d'article : l'exploitation vit de traçabilité. Les dates de mise à jour ne sont affichées que si elles sont réelles.
3. **Schéma au trait fin** (chemin d'une requête, d'un mail, d'un décodage) généré localement, en SVG sans `<title>` ni `style=""`, trait d'accent sur le point d'intérêt. Remplace les blobs sur les pages d'article.

## À éviter (respecté)

Pas de dégradé violet/bleu, de verre dépoli, d'ombres lourdes, de cartes rondes identiques partout, d'animation décorative ni de faux terminal. L'accueil garde sa structure : profil et outils sur le fond, quelques cartes seulement.

## Alternative (au plus une)

**Statu quo corrigé** : on garde l'identité 0013 telle quelle et la phase 3 se limite à fusionner les règles CSS contradictoires, soigner la typographie de lecture du blog, durcir les tests responsive (320 → 1920) et unifier les composants des outils. Moins de risque, moins de nouveauté visible.

## Ce que je recommande

La direction principale, appliquée par petites touches (tokens d'abord, puis blog, puis le reste), car elle apporte des éléments propres à votre contenu pour un coût limité. Si vous préférez ne pas retoucher l'identité livrée il y a 10 jours, l'alternative est entièrement valable.
