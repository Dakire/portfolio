---
title: "L'IA au travail : comparatif des assistants pour un technicien informatique"
seoTitle: 'Comparatif des assistants IA pour un technicien IT'
description: 'Comment je choisis un assistant IA pour des scripts, du dépannage et de la documentation : ChatGPT, Claude, Gemini, Copilot, Mistral, DeepSeek, Perplexity.'
summary: "J'utilise l'IA depuis 2022 et j'ai commencé avec ChatGPT. Ce dossier compare sept assistants sur ce qui compte dans un métier informatique : scripts PowerShell, dépannage, documentation, lecture de logs, et surtout ce qu'on peut leur confier sans enfreindre le RGPD. Chaque outil a son article, avec ses tarifs datés."
date: 2026-11-06
category: ia
tags: ['IA', 'ChatGPT', 'Claude', 'Gemini', 'RGPD']
---

_Dossier rédigé le 6 novembre 2026. Tarifs et versions : pages officielles consultées ce jour-là._

## Ma ligne éditoriale

J'utilise l'IA depuis 2022 et j'ai commencé avec ChatGPT, en novembre 2022, dès la sortie de la version conversationnelle. Je m'en sers pour corriger des textes, vérifier rapidement des informations et développer.

Règles de ce dossier :

- **Je dis ce que j'ai testé et ce que je n'ai pas testé.** Un avis sans essai est présenté comme tel.
- **Les prix et les versions sont datés** et viennent des pages officielles quand elles sont lisibles. Quand je n'ai pas pu les lire, je l'écris.
- **Une IA qui se trompe n'est pas un scandale, c'est un fait de départ.** Chaque article dit où l'outil a tendance à inventer.
- **Aucun partenariat, aucun lien d'affiliation.**

## Le comparatif en une table

| Assistant                      | Là où il est à l'aise                                                     | Là où je me méfie                                            | Article                                                                  |
| ------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| ChatGPT                        | Usage généraliste, beaucoup de fonctions (fichiers, images, voix, tâches) | Offre et tarifs qui bougent souvent, publicité sur Go        | [ChatGPT](/blog/chatgpt-usages-it-tarifs-confidentialite/)               |
| Claude                         | Textes longs, code, documents à reformuler                                | Limites d'usage qui varient selon l'offre                    | [Claude](/blog/claude-usages-it-tarifs-confidentialite/)                 |
| Gemini                         | Écosystème Google (Workspace, Drive, Gmail), grand contexte               | Nombre d'offres et de paliers, noms qui changent             | [Gemini](/blog/gemini-usages-it-tarifs-confidentialite/)                 |
| Microsoft Copilot              | Travail dans Word, Excel, Outlook, Teams avec les données du tenant       | Licence payante en plus, résultats liés aux droits existants | [Copilot](/blog/copilot-microsoft-365-usages-it-tarifs-confidentialite/) |
| Mistral (Le Chat, devenu Vibe) | Éditeur français, usage généraliste, développement                        | Nom du produit en transition                                 | [Mistral](/blog/mistral-le-chat-vibe-usages-it-tarifs-confidentialite/)  |
| DeepSeek                       | Modèles accessibles par API à bas coût                                    | Données traitées en Chine : à exclure pour des données pro   | [DeepSeek](/blog/deepseek-usages-it-confidentialite/)                    |
| Perplexity                     | Recherche avec sources citées                                             | Vérifier chaque source ; la réponse n'est pas la source      | [Perplexity](/blog/perplexity-recherche-sources-usages-it/)              |

Ce tableau est ma lecture à la date de rédaction. Au quotidien, j'utilise Claude, Gemini et ChatGPT.

## Ce que je demande à l'IA dans un métier informatique

1. **Écrire ou corriger un script** (PowerShell, Bash, Python) : fiable pour un squelette, jamais pour une exécution sans relecture. Toujours tester avec `-WhatIf` ou sur un compte de test.
2. **Orienter un dépannage** : un message d'erreur, une piste de cause, les commandes de diagnostic à lancer. L'IA propose, c'est la machine qui répond.
3. **Documenter** : transformer des notes en procédure, reformuler une réponse à un client, relire un compte rendu.
4. **Lire des journaux** : résumer un extrait, repérer un motif. À condition d'avoir anonymisé l'extrait.

## Ce qu'on ne colle jamais dans un assistant

Ma règle, sur tous les assistants : jamais de mot de passe, de RIB ou d'IBAN, et jamais de nom ni de prénom. Plus largement, tant que le service n'est pas couvert par un contrat qui encadre le traitement des données, **ne collez pas** :

- mots de passe, clés d'API, jetons, secrets de connexion, clés BitLocker ;
- données personnelles de clients ou de collègues (noms, e-mails, numéros, adresses IP associées à une personne) ;
- contenus de messages, contrats, documents confidentiels ;
- schémas du réseau interne, plans d'adressage, règles de pare-feu complètes ;
- journaux bruts non anonymisés.

**Anonymisez** : remplacez les noms par `client-A`, les adresses par `192.0.2.10`, les domaines par `exemple.fr`. Pour un usage professionnel, préférez l'offre professionnelle d'un éditeur, qui précise l'usage des données, et lisez ses conditions. La CNIL publie des recommandations sur l'IA : [cnil.fr/fr/intelligence-artificielle](https://www.cnil.fr/fr/intelligence-artificielle).

## Que faire ?

1. **Choisissez un outil principal**, un second pour vérifier. Plus, c'est de la dispersion.
2. **Écrivez une règle d'une page** pour l'équipe : ce qui est permis, ce qui est interdit, qui est le référent.
3. **Anonymisez avant de coller.** Faites-en un réflexe, pas une consigne.
4. **Relisez tout ce qui s'exécute.** Script, règle de pare-feu, requête : lu et compris avant d'être lancé.
5. **Datez vos choix** : un tarif ou un modèle de novembre 2026 ne vaudra pas en 2027.

## Sources

- [CNIL : intelligence artificielle](https://www.cnil.fr/fr/intelligence-artificielle)
- Les sources propres à chaque assistant sont dans son article.
