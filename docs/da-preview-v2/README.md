# Refonte proposée : « Pit wall »

Statut : **maquette soumise à validation, rien n'est appliqué au site.** Ouvrir [index.html](index.html), [article.html](article.html) et [tool.html](tool.html) dans un navigateur (bouton « Thème » pour passer du sombre au clair). Elle remplace la proposition précédente [da-preview](../da-preview/README.md), jugée trop proche de l'existant.

## Idée

Un univers IT et sport mécanique, sans en faire un déguisement : le **mur des stands** (pit wall), là où l'on lit des données, on décide vite et on documente. Le site reste celui d'un technicien sérieux ; l'auto et la F1 ne sont que le langage visuel (coins coupés, chiffres de position, drapeaux, aplat de signalisation).

## Ce qui change, visiblement

| Élément              | Aujourd'hui                                | Maquette                                                                                                     |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Palette              | encre chaude brune, terracotta             | **carbone froid** (`#0c0d0f`) et **os** en clair (`#f2f0e9`), un seul accent : **jaune-vert fluo** `#c8ff2e` |
| Formes               | cartes arrondies, blobs                    | **coin coupé** (chanfrein) : cartes, boutons, logo, bandeau de contact. Plus de blobs.                       |
| Titres               | Bricolage, taille moyenne                  | Bricolage **condensé 75 %, 800**, très grands (jusqu'à 9,5 rem au héros)                                     |
| Listes               | lignes de registre                         | **classement** : numéro de position en grand, filet épais en tête, survol qui allume le numéro               |
| Gravité des alertes  | (nouveau, champ `severity`)                | **drapeaux** : rouge (critique), jaune (attention), vert (correctif disponible), toujours symbole + mot      |
| Articles             | grands chiffres orange, colonne centrée    | sommaire collant, numéro mono, schéma au trait avec **le tronçon concerné en lime**, tableaux à filet        |
| Contact              | carte terracotta                           | grand aplat **lime** à coin coupé                                                                            |
| Typographie de texte | Atkinson Hyperlegible Next, JetBrains Mono | **inchangée** (lisibilité, aucune nouvelle dépendance)                                                       |

L'accent lime sert de fond (texte encre dessus) ou de trait ; en thème clair, les liens restent en encre avec un soulignement lime, parce que le lime sur fond clair ne se lit pas comme texte.

## Contrastes (calculés)

Sombre : texte 16,9:1, texte courant 12,8:1, sourdine 7,4:1, lime sur carbone 16,5:1, bordure de composant 3,35:1, drapeaux 6,5 à 11,5:1. Clair : texte 16,6:1, courant 11,8:1, sourdine 5,9:1, encre sur lime 16,0:1, bordure 3,5:1, drapeaux 4,6 à 5,1:1. L'anneau de focus est lime en sombre et encre en clair (le lime sur fond clair ferait moins de 3:1). Le tout dépasse WCAG 2.2 AA.

## Réel ou exemple

Réels, repris du site : le nom, l'intitulé du poste, les cinq domaines et leur ligne, les titres des réalisations, des articles et des outils. **Exemples ou à reprendre** : l'accroche du héros, le contenu de l'article et le tableau, les sorties de l'outil. Rien n'est inventé pour l'accueil final : il reprendra `profile.ts`.

## Ce que je n'ai pas fait, volontairement

- **Aucun logo, couleur ni nom de constructeur** (BMW, ses couleurs « M », un équipementier ou une écurie) : ce sont des marques déposées, et ce serait de l'imitation sur un site professionnel.
- **Aucune affirmation sur vos passions** dans les textes. Si la voiture ou la F1 est un vrai centre d'intérêt, on peut ajouter une page ou un encadré écrit par vous ; je ne l'invente pas (règle du ton éditorial).
- Pas de tableau de bord de télémétrie ni de faux terminal : les chiffres de position sont de simples numéros de liste.

## Coût et risques

- **Dépendances** : aucune (mêmes polices).
- **Ampleur** : la refonte touche `tokens.css` (palette, rayons) puis `site.css` et `components.css` (formes, listes, héros, bandeaux). Je la ferais par étapes commitées : tokens, puis accueil, puis blog et articles, puis outils et pages restantes, avec captures à chaque étape et tests axe, e2e et débordement (320 à 1920 px) verts.
- **Formes à coin coupé** : `clip-path` rogne les contours et l'anneau de focus d'un élément découpé ; je ne mets le focus que sur des éléments intérieurs (liens), comme dans la maquette.
- **Identité** : c'est la quatrième identité en un mois. Le lime fluo est un choix tranché ; si vous le trouvez trop voyant, la même structure fonctionne avec un accent plus sobre (orange papaye ou blanc seul).
- **Contraste du lime** : à ne jamais utiliser en texte sur fond clair (la maquette ne le fait pas).

## Décisions à prendre

1. Direction « Pit wall » (carbone et lime, coins coupés) : oui, non, ou avec un autre accent ?
2. Mot des drapeaux : « Drapeau rouge · Critique », ou seulement « Critique » avec le symbole ?
3. Thème par défaut : sombre (comme aujourd'hui) ou suivre le système ?
