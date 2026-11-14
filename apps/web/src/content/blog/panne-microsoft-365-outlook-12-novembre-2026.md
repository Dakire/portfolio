---
title: 'Panne mondiale de Microsoft 365 et Outlook du 12 novembre 2026'
seoTitle: 'Panne Microsoft 365 et Outlook du 12 novembre 2026'
description: "Panne mondiale d'Exchange Online et d'Outlook le 12 novembre 2026 : ce qui est établi, ce qui reste inconnu, et comment limiter l'impact pour votre structure."
summary: "Le 12 novembre 2026, Exchange Online et Outlook ont été perturbés pendant de longues heures dans 74 pays, avec des effets sur Teams, SharePoint et Copilot. Microsoft écarte une cyberattaque et parle d'un processus de connexions sécurisées saturé ; le déclencheur n'était pas identifié au 13 novembre."
date: 2026-11-14
category: actualites
tags: ['Microsoft 365', 'Outlook', 'Exchange Online', 'Panne']
---

_Article rédigé le 14 novembre 2026, à partir des articles du Monde Informatique, de franceinfo et d'Ouest-France. Microsoft n'avait pas publié de bilan final au moment de la rédaction : les points « inconnus » ci-dessous peuvent changer. Sources en fin d'article._

## Ce qui est établi

- **Début** : jeudi **12 novembre 2026**. L'heure précise de départ n'est pas donnée dans les articles consultés.
- **Services touchés** : principalement **Exchange Online et Outlook** (messages envoyés ou reçus, accès à la boîte, calendriers). Selon le Monde Informatique, la panne a aussi affecté **Copilot, SharePoint Online, Planner** et certains outils d'administration. **Teams** a été touché plus légèrement : messagerie instantanée et visioconférence ont globalement fonctionné, mais pas les calendriers ni la planification de réunions. Les connecteurs Microsoft 365 d'OpenAI et d'Anthropic ont aussi été perturbés.
- **Ampleur** : des dysfonctionnements signalés dans **74 pays et territoires** d'après Downdetector, avec plus de **130 000 signalements** concernant Outlook aux États-Unis au plus fort de la panne. Ces chiffres reposent sur des déclarations d'utilisateurs : ils ne donnent pas le nombre exact de personnes touchées (les médias parlent de « dizaines de milliers » à « millions »).
- **Durée** : près de 11 heures après le début, Microsoft peinait encore à stabiliser ses infrastructures. L'entreprise a continué de travailler sur le sujet le vendredi 13 novembre et a constaté des améliorations, sans annoncer de rétablissement complet dans les articles consultés.
- **Cause annoncée** : Microsoft a d'abord évoqué une surcharge de certains composants. L'enquête a ensuite pointé un **processus chargé d'établir des connexions sécurisées sur les serveurs, saturé** et empêchant le traitement normal des requêtes.
- **Cyberattaque** : Charles Lamanna, dirigeant de Microsoft, a déclaré que rien ne laissait penser à une attaque.
- **Tentatives de résolution** : redistribution des connexions, redémarrages de machines, restauration de certaines configurations. Plusieurs serveurs sont redevenus indisponibles après leur remise en service.

## Ce qui reste inconnu

- L'**élément déclencheur** de la saturation n'était pas identifié.
- L'**heure de résolution complète** et l'**identifiant d'incident** ne figuraient pas dans les articles consultés.
- Un **rapport d'incident** (post-incident review) de Microsoft devrait suivre, comme pour les pannes précédentes ; je ne peux pas en garantir ni la date ni le contenu.

## Que faire pendant une panne de ce type ?

1. **Vérifier que le problème vient bien de Microsoft** avant de toucher à vos postes ou à votre configuration : le **centre d'administration Microsoft 365** (état du service, incidents) et la page d'état publique. Un problème limité à quelques utilisateurs n'a pas la même cause qu'un incident mondial.
2. **Prévenir les utilisateurs** par un canal indépendant (SMS, téléphone, autre messagerie) : ne comptez pas sur l'e-mail pour annoncer une panne d'e-mail.
3. **Ne pas renvoyer en boucle** les messages en erreur : les files d'attente se vident d'elles-mêmes, et des renvois créent des doublons. Les expéditeurs externes dont le message n'a pas pu être livré reçoivent en général un message d'erreur temporaire, puis le serveur réessaie.
4. **Documenter** les heures de début et de fin côté organisation : utile pour un éventuel SLA, une demande de crédit de service ou un retour d'expérience.
5. **Après la panne**, chercher les messages perdus ou en retard : en cas de doute sur une livraison, le suivi de messages d'Exchange Online (trace des messages) montre le sort d'un message précis.

## Préparer la prochaine fois

- Avoir **un canal de secours** pour prévenir et coordonner l'équipe (téléphone, messagerie instantanée tierce).
- Garder **les contacts essentiels hors de la boîte** (annuaire exporté, numéros d'astreinte).
- Savoir où lire l'état du service et qui l'annonce en interne.
- Vérifier que les **enregistrements MX et SPF/DKIM/DMARC** sont corrects : après une panne, des messages en retard peuvent révéler un domaine mal configuré. L'article [SPF, DKIM et DMARC expliqués](/blog/spf-dkim-dmarc-expliques/) détaille le sujet, et [délivrabilité : diagnostiquer les mails en spam ou rejetés](/blog/delivrabilite-diagnostiquer-mails-spam-rejetes/) aide à analyser un rejet.

## À retenir

- La panne du 12 novembre a surtout touché Exchange Online et Outlook, dans 74 pays, avec des effets sur Teams, SharePoint et Copilot.
- Microsoft écarte une cyberattaque et décrit un processus de connexions sécurisées saturé ; le déclencheur restait à identifier.
- Ayez un canal de secours et sachez lire l'état du service avant le prochain incident.

## Sources

- [Le Monde Informatique : Panne mondiale de Microsoft 365, Outlook perturbé pendant des heures](https://www.lemondeinformatique.fr/applications-developpement/panne-mondiale-de-microsoft-365-outlook-perturbe-p)
- [franceinfo : Une panne mondiale touche la messagerie Outlook de Microsoft](https://www.franceinfo.fr/internet/une-panne-mondiale-touche-la-messagerie-outlook-de-microsoft_8280611.html)
- [franceinfo : « aucun signe d'action malveillante ou de cyberattaque » à ce stade](https://www.franceinfo.fr/internet/microsoft/une-panne-mondiale-touche-la-messagerie-outlook-de-microsoft-les-mesures-pour-la-resoudre-ne-fonctionnent-pas-comme-prevu_8280422.html)
- [Ouest-France : Microsoft 365, Outlook, Teams, ce que l'on sait de la panne mondiale](https://www.ouest-france.fr/high-tech/microsoft/microsoft-365-outlook-teams-ce-que-lon-sait-de-la-panne-mondiale-qui-touche-les-messageries-informatiques-bbb822ce-df27-11f1-9a29-f4bab172af08)
