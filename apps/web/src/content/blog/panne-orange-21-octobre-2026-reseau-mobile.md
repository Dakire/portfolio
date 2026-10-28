---
title: "Panne Orange du 21 octobre 2026 : ce que l'on sait et comment s'en protéger"
description: "Dix heures sans réseau mobile Orange et Sosh : chronologie, cause annoncée, et les mesures concrètes pour qu'une panne d'opérateur ne bloque pas une petite entreprise."
date: 2026-10-28
category: actualites
tags: ['Orange', 'Panne', "Continuité d'activité"]
---

Le **mercredi 21 octobre 2026**, le réseau mobile d'Orange et de Sosh est tombé en France pendant près de dix heures. Appels, SMS et Internet mobile ont été coupés, pour les particuliers comme pour les entreprises. Quelques jours plus tard, la cause est mieux connue, et la panne donne l'occasion de se poser une question simple : que se passe-t-il dans votre structure si l'opérateur tombe ?

## Ce qui s'est passé

- **Début** dans la matinée du 21 octobre ; les signalements ont culminé vers 11 h 50, avec près de 12 000 déclarations sur Downdetector.
- **Périmètre** : le réseau mobile d'Orange et de Sosh (environ 21,6 millions de clients mobiles Orange en France fin juin). Quelques centaines d'abonnés SFR et Bouygues Telecom ont aussi signalé des problèmes ; ces opérateurs n'ont pas communiqué et le lien avec l'incident d'Orange n'est pas établi.
- **Cause annoncée** : dans un premier temps, Orange a parlé d'« une défaillance d'un équipement au niveau de notre cœur de réseau mobile ». Son directeur général pour la France, Jérôme Hénique, a ensuite évoqué auprès du Figaro un **bug logiciel « inédit et exceptionnel »** sur des équipements Nokia, en écartant la piste d'une cyberattaque.
- **Mécanisme** (tel que rapporté par la presse) : l'équipement principal et l'équipement de secours utilisaient la même version logicielle, donc le secours a subi le même bug. Certains messages d'erreur le déclenchaient, et chaque redémarrage refaisait tomber les équipements.
- **Résolution** : le problème a été localisé vers 17 h, avec l'intervention d'une centaine de techniciens, et le service est revenu progressivement en début de soirée.
- **Geste commercial** : doublement de l'enveloppe de données mobiles pendant un mois pour les abonnés concernés. Pas d'autre mesure générale annoncée, hormis des dispositions contractuelles pour les entreprises.

## Ce qu'on ne sait pas

Les détails techniques viennent de déclarations relayées par la presse, pas d'un rapport d'incident publié. Tant qu'Orange n'a pas publié d'analyse détaillée, il vaut mieux garder les explications comme provisoires.

## Pourquoi ça concerne une petite structure

Une panne d'opérateur n'est pas qu'un désagrément. Concrètement, elle coupe :

- le **téléphone** : lignes mobiles de l'équipe, standard renvoyé sur mobile ;
- les **codes SMS** : authentification à deux facteurs par SMS, validation de paiement, connexion à certains services ;
- les **alertes** : supervision ou astreinte qui préviennent par SMS ;
- l'**Internet mobile** : partage de connexion, terminaux de paiement en 4G, objets connectés.

## Les mesures qui servent vraiment

1. **Ne pas dépendre d'un seul opérateur pour l'essentiel.** Une deuxième ligne chez un autre opérateur, souvent en eSIM sur le même téléphone, coûte peu et couvre ce cas.
2. **Garder une connexion fixe de secours, et inversement.** Cette panne touchait le mobile : une ligne fixe offrait une alternative. Un routeur 4G/5G de secours sert dans le cas inverse (panne de la fibre).
3. **Passer par des applications sur Wi-Fi.** Orange recommandait de se connecter à un réseau Wi-Fi pour utiliser Internet et les applications de messagerie ou de visioconférence. Un softphone ou une téléphonie sur IP permet de rester joignable sans réseau mobile.
4. **Sortir du SMS pour l'authentification.** Une application d'authentification ou une clé de sécurité fonctionne sans réseau mobile ; le code reçu par SMS, non. C'est une des mesures de base du [guide de sécurisation de Microsoft 365 et Google Workspace](/blog/securiser-microsoft-365-google-workspace-reglages-de-base/).
5. **Savoir quoi faire pour les urgences.** Le département du Tarn a rappelé que, si l'appel n'aboutit pas, on peut composer le 112 depuis un autre réseau mobile disponible ou depuis une ligne fixe.
6. **Avoir un plan écrit et hors réseau.** Liste des contacts clés sur papier ou en local, point de rendez-vous, personne qui décide du plan B. Cinq lignes suffisent, à condition qu'elles existent avant la panne.
7. **Vérifier ses contrats.** Les entreprises disposent de dispositions contractuelles propres : engagement de rétablissement, pénalités. Autant les connaître avant d'en avoir besoin.

## À retenir

- Même un opérateur majeur, avec des équipements redondants, peut tomber pendant une journée : la redondance logicielle n'aide pas si le secours a le même bug.
- Le point faible est souvent l'usage détourné du mobile (SMS, 2FA), plus que le téléphone lui-même.
- Un second opérateur en eSIM et une authentification sans SMS règlent l'essentiel du risque pour un coût faible.

## Sources

- [Génération NT : un bug logiciel inédit a provoqué un black-out de dix heures](https://www.generation-nt.com/actualites/panne-orange-bug-logiciel-nokia-reseau-mobile-2083450)
- [France 3 Régions : panne Orange, ce que l'on sait des perturbations sur le réseau mobile](https://france3-regions.franceinfo.fr/occitanie/haute-garonne/toulouse/panne-orange-ce-que-l-on-sait-des-perturbations-qui-touchent-le-reseau-mobile-ce-mercredi-3436962.html)
