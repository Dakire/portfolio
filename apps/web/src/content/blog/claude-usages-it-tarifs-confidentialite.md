---
title: 'Claude pour un technicien informatique : usages, limites, tarifs et RGPD'
seoTitle: 'Claude au travail : usages IT, tarifs et RGPD'
description: 'Claude dans un métier informatique : scripts, documents longs, dépannage, confidentialité, et les offres Free, Pro, Max, Team, Enterprise au 6 novembre 2026.'
summary: "Claude est l'assistant d'Anthropic. Je le regarde sous l'angle d'un technicien : ce qu'il fait bien sur des scripts et des textes longs, où il faut le vérifier, ce qu'on peut lui confier, et ses offres datées du 6 novembre 2026, lues sur la page officielle."
date: 2026-11-06
category: ia
tags: ['Claude', 'Anthropic', 'IA', 'RGPD']
draft: true
---

_Brouillon du 6 novembre 2026. **[À COMPLÉTER PAR GUILLAUME]** marque ce qui attend mon vécu (voir `docs/questions-contenu.md`)._

## Mon point de départ

**[À COMPLÉTER PAR GUILLAUME : quand et pourquoi j'ai essayé Claude, par rapport à ChatGPT.]**

## Ce qu'il fait bien

- **Les textes et les documents longs** : reformuler, résumer, relire une procédure.
- **Le code** : écrire, expliquer et corriger un script ; la page officielle présente aussi Claude Code, un outil de programmation, dans les offres payantes.
- **Un travail structuré** : la page officielle cite des projets, des connecteurs, la création de fichiers et l'exécution de code selon l'offre.

## Où je me méfie

- Comme tous les assistants, il peut **inventer** une option ou une référence : vérifiez dans la documentation.
- **Les limites d'usage dépendent de l'offre** et se renouvellent par périodes : un usage intensif butte plus vite sur l'offre gratuite.
- Il ne voit pas votre parc : une réponse sur « votre » Active Directory repose sur ce que vous lui décrivez.

**[À COMPLÉTER PAR GUILLAUME : un cas où Claude s'est trompé, ou a mieux fait qu'un autre outil.]**

## Cas d'usage IT

| Besoin          | Ce que je lui demande                                         | Ce que je vérifie                          |
| --------------- | ------------------------------------------------------------- | ------------------------------------------ |
| Script          | Un script commenté, avec gestion d'erreur et journalisation   | Chaque cmdlet, un essai sur un compte test |
| Documentation   | Mettre au propre une procédure à partir de notes brouillonnes | Les commandes et les valeurs               |
| Revue           | Relire un script existant et signaler les risques             | Les remarques, une par une                 |
| Analyse de logs | Repérer un motif dans un extrait anonymisé                    | Le motif dans le journal complet           |

## Confidentialité et RGPD

- **Ne collez pas** de secrets, de données personnelles, de contenus de messages ni de schémas internes sur une offre individuelle.
- **Anonymisez** avant de coller.
- L'offre **Enterprise** ajoute, selon la page officielle, des contrôles d'administration, des journaux d'audit, une conservation des données configurable et le SCIM ; l'offre **Team** ajoute la facturation centrale, l'authentification unique et des contrôles d'administration. Ce sont ces offres qu'il faut regarder pour un usage en entreprise, après lecture des conditions sur l'usage des données.

## Tarifs et versions (page officielle consultée le 6 novembre 2026)

| Offre      | Prix indiqué                                                                         | Ce que la page indique                                              |
| ---------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Free       | 0 $                                                                                  | Usage limité, pas de Claude Code                                    |
| Pro        | 20 $ par mois, ou 17 $ par mois en facturation annuelle (200 $ d'avance)             | Plus d'usage que Free, Claude Code, projets, intégrations           |
| Max        | 100 $ par mois                                                                       | 5 fois l'usage de Pro, crédits d'API de 100 $ par mois              |
| Ultra      | 200 $ par mois                                                                       | 10 fois l'usage de Pro par semaine, crédits d'API de 200 $ par mois |
| Team       | 20 $ par siège et par mois (annuel) ou 25 $ (mensuel) ; siège Premium 100 $ ou 125 $ | 2 à 150 membres, administration centralisée                         |
| Enterprise | 20 $ par siège et par mois (annuel, 20 sièges minimum) plus l'usage aux tarifs d'API | Administration, audit, rétention personnalisée                      |

Prix en dollars tels qu'affichés (la page ne précise pas le régime de taxes) : consultez-la avant de décider.

## Mon usage

**[À COMPLÉTER PAR GUILLAUME : à quoi je m'en sers au quotidien, et ce qui m'a fait garder ou quitter l'outil.]**

## Que faire ?

1. Testez l'offre gratuite sur un cas réel anonymisé.
2. Pour du code, faites-lui expliquer ce qu'il propose, puis vérifiez dans la documentation.
3. Pour une équipe, comparez Team et Enterprise sur le contrat, pas sur le prix.
4. Notez la date de votre décision : les offres évoluent.

## Sources

- [Tarifs Claude (page officielle)](https://claude.com/pricing), consultée le 6 novembre 2026
- [CNIL : intelligence artificielle](https://www.cnil.fr/fr/intelligence-artificielle)
