---
title: 'DeepSeek pour un technicien informatique : usages, limites et RGPD'
seoTitle: 'DeepSeek au travail : usages IT, limites et RGPD'
description: "DeepSeek dans un métier informatique : son intérêt par API, les réserves des autorités européennes sur les données, et pourquoi je l'exclus du travail."
summary: "DeepSeek attire par ses modèles accessibles par API à bas coût. Il pose surtout une question de données : sa politique de confidentialité place le traitement sur des serveurs en Chine, ce qui a conduit des autorités européennes à réagir en 2025. Voici ce que je retiens, ce que je n'ai pas pu vérifier, et la règle d'usage que j'en tire."
date: 2026-11-06
category: ia
tags: ['DeepSeek', 'IA', 'RGPD', 'Confidentialité']
draft: true
---

_Brouillon du 6 novembre 2026. **[À COMPLÉTER PAR GUILLAUME]** marque ce qui attend mon vécu (voir `docs/questions-contenu.md`). Les informations réglementaires datent de 2025 ; je n'ai pas trouvé de source récente sur l'état des procédures._

## Mon point de départ

**[À COMPLÉTER PAR GUILLAUME : l'ai-je testé ? Pourquoi, avec quelles données (aucune donnée réelle, j'espère), quel résultat ?]**

## Ce qu'il fait bien

- **Un accès par API** : la documentation officielle présente des points d'accès compatibles avec ceux d'OpenAI et d'Anthropic, ce qui facilite l'intégration dans des outils existants.
- **Des modèles récents** : la page des nouveautés cite DeepSeek-V4-Pro et DeepSeek-V4.1-Flash-1017 à la date où je l'ai lue (sans date de publication affichée).
- **Un intérêt pour le développement** : la documentation cite des intégrations avec des outils de programmation assistée.

## Où je me méfie : les données

- La politique de confidentialité de DeepSeek indique, selon la presse, que **les données des utilisateurs sont stockées sur des serveurs en Chine** et peuvent être partagées avec des sociétés affiliées et des prestataires.
- **En janvier 2025**, l'autorité italienne de protection des données (le Garante) a bloqué l'accès à l'application le temps de vérifier la collecte et le stockage des données ; la commissaire de Berlin a demandé à Apple et Google de retirer l'application, estimant le transfert de données vers la Chine non conforme au RGPD ; la CNIL a annoncé examiner ses pratiques. Ces informations viennent de la presse de l'époque.
- **Je n'ai pas trouvé de source récente** sur l'état actuel de ces procédures. Vérifiez les communiqués du Garante, de l'autorité de Berlin et de la CNIL avant de vous appuyer sur ce paragraphe.

Conséquence pratique : pour toute **donnée professionnelle ou personnelle**, je ne l'utilise pas dans son application ou son site web.

**[À COMPLÉTER PAR GUILLAUME : ma position personnelle et ce qui la motive.]**

## Cas d'usage IT (sans donnée réelle)

| Besoin                  | Ce que je lui demande                                       | Précaution                           |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------ |
| Question de syntaxe     | Une option de commande, une expression régulière            | Aucune donnée client, rien d'interne |
| Exercice, apprentissage | Un script d'exemple fictif                                  | Tester en laboratoire                |
| Intégration par API     | Évaluer un modèle sur des données publiques ou synthétiques | Jamais de données de production      |

## Confidentialité et RGPD

- **Ne collez pas** de données professionnelles ni personnelles.
- Pour un usage en entreprise, **évaluez le contrat et la localisation du traitement** avant tout ; si vous ne pouvez pas conclure, passez votre chemin.
- Si vous utilisez des poids de modèles publiés et les exécutez vous-même, la question des données est différente : c'est alors votre propre infrastructure qui traite, et c'est à vous de la sécuriser. Vérifiez la licence du modèle que vous utilisez, que je n'ai pas pu confirmer sur la page consultée.

## Tarifs et versions

Je n'ai pas pu lire de grille tarifaire officielle pour l'application ; la documentation de l'API publie des tarifs par modèle. **À vérifier sur la plateforme officielle le jour où vous décidez.**

## Mon usage

**[À COMPLÉTER PAR GUILLAUME : ce que j'en fais, ou pourquoi non.]**

## Que faire ?

1. **Ne l'ouvrez pas à l'équipe** pour des données de travail sans analyse écrite.
2. Pour tester, utilisez des données fictives.
3. Rédigez une règle : « aucun outil d'IA non validé pour des données pro ».
4. Relisez les communiqués des autorités avant de vous prononcer.

## Sources

- [Notes de version de l'API DeepSeek (page officielle)](https://api-docs.deepseek.com/news/news), consultées le 6 novembre 2026
- [Journal du Geek, 30 janvier 2025 : DeepSeek interdit en Europe](https://www.journaldugeek.com/2025/01/30/tout-juste-lance-deepseek-est-deja-interdit-en-europe/)
- [IT-Connect : l'Allemagne demande à Google et Apple de supprimer l'application](https://www.it-connect.fr/ia-allemagne-demande-google-et-apple-supprimer-applications-deepseek/)
- [CNIL : intelligence artificielle](https://www.cnil.fr/fr/intelligence-artificielle)
