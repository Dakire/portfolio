# Ton éditorial de grichard.eu

Règles d'écriture du site, tirées d'une relecture de `profile.ts`, `site-text.ts`, des outils et des articles (6 novembre 2026). Objectif : des textes qui sonnent comme leur auteur, sans rien inventer.

## Ce que la relecture a montré

Le site est déjà assez concret : peu de tirets longs (aucun dans les articles, deux par outil au plus), pas de « guide ultime », pas de « dans un monde en constante évolution ». Les défauts qui restaient étaient plus fins :

- **Le cliché d'ouverture** : « L'informatique me passionne depuis toujours » (la page À propos).
- **L'auto-qualification** : « administration avancée », « migrations complexes » : l'adjectif affirme, la liste qui suit prouve déjà.
- **L'injonction creuse** : « n'hésitez pas à… » (outil d'en-têtes).
- **Les titres de conclusion** : « En résumé » en fin d'article, quand les trois lignes qui suivent répètent l'introduction. Le format « À retenir » reste utile quand il ajoute une décision, pas un écho.

## Règles

1. **Première personne, présent.** « Je teste », « j'écris l'outil », pas « le technicien se charge de ».
2. **Un fait vaut mieux qu'un adjectif.** Si une liste suit (MDT, WDS, Active Directory), l'adjectif « avancé » n'apporte rien.
3. **Un titre = ce que l'on va lire.** Pas de « guide ultime », « tout savoir sur », « incontournable ».
4. **Phrases de longueur variée.** Une phrase longue qui développe, puis une courte qui tranche.
5. **Une position assumée par article** : « je préfère », « je ne l'utilise pas », avec la raison. Les passages où l'auteur doit parler de ce qu'il a vécu sont des emplacements marqués, jamais remplis à sa place.
6. **Pas de tirets longs en incise.** Une virgule, deux-points ou deux phrases. Le tiret long reste pour un intervalle ou un dialogue.
7. **Pas de liste de trois adjectifs** (« rapide, fiable et performant »).
8. **La conclusion ne répète pas l'introduction.** Elle donne l'action : que faire, dans quel ordre.
9. **Aucun fait retiré, aucun ajouté.** Une reformulation garde le sens exact (dates, versions, noms, chiffres).
10. **Typographie française** : espaces insécables avant `: ; ? !` et autour des guillemets « », chiffres tabulaires dans les tableaux.

## Avant / après (modifications appliquées)

| Avant                                                                                                                       | Après                                                                                                          | Pourquoi                                          |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| « L'informatique me passionne depuis toujours, et j'ai gardé l'habitude de tout tester pour comprendre comment ça marche. » | « Je suis technicien informatique, et j'ai toujours testé les choses pour comprendre comment elles marchent. » | Règles 1 et 2 : on passe du cliché au fait.       |
| « Quand une tâche se répète, j'écris l'outil qui la fait à ma place. »                                                      | « Quand une tâche revient, j'écris l'outil qui la fait à ma place. »                                           | Plus court, même sens.                            |
| « Administration avancée de Microsoft 365 et Google Workspace : identités, sécurité, MCO. »                                 | « Administration de Microsoft 365 et de Google Workspace : identités, sécurité, MCO. »                         | Règle 2 : la liste prouve, l'adjectif affirme.    |
| « Migrations complexes de messagerie : IMAP (OVH, Gandi…) »                                                                 | « Migrations de messagerie : IMAP (OVH, Gandi…) »                                                              | Règle 2.                                          |
| « Ils peuvent contenir des adresses et des adresses IP : n'hésitez pas à les masquer avant de les partager. »               | « Ils contiennent des adresses e-mail et des adresses IP : masquez-les avant de les partager. »                | Règle 1 : l'impératif direct, le fait au présent. |

Les versions anglaises sont alignées (parité vérifiée par les tests).

## Ce qui reste à faire avec Guillaume

Des textes plus personnels demandent son vécu, que je ne peux pas inventer :

- **À propos et parcours** : une phrase sur ce qui l'a mené à ce métier, un exemple concret d'outil écrit « parce qu'une tâche revenait » (quel outil, quelle tâche).
- **Réalisations** : les blocs `context`, `role`, `steps`, `result` de chaque page, aujourd'hui vides et masqués. Un paragraphe par réalisation, dans ses mots, vaut mieux que cinq phrases génériques.
- **Articles anciens** : « En résumé » dans `migration-messagerie-…` et `patch-tuesday-octobre-2026-pme` : à remplacer par une phrase qui tranche (à décider avec lui).
- **Série IA** : voir [questions-contenu.md](questions-contenu.md).
