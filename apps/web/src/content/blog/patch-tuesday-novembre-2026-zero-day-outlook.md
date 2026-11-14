---
title: 'Patch Tuesday de novembre 2026 : un zero-day Outlook et 1 093 correctifs'
seoTitle: 'Patch Tuesday novembre 2026 : zero-day Outlook, priorités'
description: 'Patch Tuesday du 10 novembre 2026 : un zero-day Outlook exploité (fuite de hash NTLM), 1 093 failles corrigées et les correctifs à installer en premier.'
summary: "Le Patch Tuesday du 10 novembre 2026 corrige 1 093 vulnérabilités, dont un zero-day Outlook déjà exploité : un fichier Office piégé peut faire fuiter le hash NTLMv2 de l'utilisateur. Voici l'ordre d'installation pour une petite structure, avec les chiffres à vérifier vous-même."
date: 2026-11-14
category: securite
tags: ['Patch Tuesday', 'Outlook', 'Windows', 'Mises à jour']
---

_Article rédigé le 14 novembre 2026, à partir des récapitulatifs d'IT-Connect, de Qualys et de Dark Reading. Les totaux varient selon les sources ; la référence est le [Security Update Guide du MSRC](https://msrc.microsoft.com/update-guide), CVE par CVE. Sources en fin d'article._

## Le chiffre : environ 1 100 failles

Microsoft a corrigé **1 093 vulnérabilités** le 10 novembre 2026 (hors Edge), d'après IT-Connect, contre 1 407 en octobre : c'est le deuxième plus gros lot de son histoire. D'autres sources comptent différemment (jusqu'à 1 235 en incluant des correctifs tiers) : retenez l'ordre de grandeur. Répartition citée : Windows 733, Office 174, SQL Server 52, SharePoint Server 27, Exchange Server 9 ; **63 failles critiques**.

Comme pour [le Patch Tuesday d'octobre](/blog/patch-tuesday-octobre-2026-pme/), le volume importe peu pour une petite structure : ce qui compte, c'est l'ordre d'installation.

## À installer en premier : le zero-day Outlook exploité

- **CVE-2026-124194**, usurpation (spoofing) dans **Outlook**, notée **6,5** et classée modérée par Microsoft, mais **déjà exploitée**. La CISA l'a ajoutée à son catalogue des failles exploitées (KEV) le 10 novembre, avec une échéance au 24 novembre pour les agences fédérales américaines.
- **Le mécanisme** : un fichier Office piégé, ouvert par l'utilisateur, amène Outlook à se connecter à un emplacement réseau contrôlé par l'attaquant, **sans l'avertissement habituel** sur le contenu externe. Résultat : fuite du **hash NTLMv2** de l'utilisateur, utilisable pour un craquage hors ligne ou un relais NTLM.
- **Les conditions** : connectivité réseau et action de l'utilisateur. Microsoft ne donne aucun détail sur les attaques observées.
- **Les versions** : Microsoft 365 Apps for Enterprise, Office LTSC 2021 et LTSC 2024. Versions corrigées indiquées : **16.0.14334.21048** (LTSC 2021) et **16.0.17932.21140** (LTSC 2024).
- **Attention** : ce correctif passe par la **mise à jour d'Office**, pas seulement par Windows Update. Vérifiez le canal de mise à jour de vos Microsoft 365 Apps.

**Réduire le risque en attendant** : bloquer le trafic SMB sortant (port 445) vers Internet au pare-feu, ce qui empêche l'envoi du hash vers un serveur externe, et limiter le NTLM là où c'est possible. L'article [Journaux d'événements Windows : les ID à connaître](/blog/journaux-evenements-windows-id-a-connaitre/) aide à repérer les authentifications NTLM anormales.

## À traiter ensuite : critiques non exploitées

Selon IT-Connect :

| Composant        | CVE                               | Note       | À retenir                                                                                                                                         |
| ---------------- | --------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows Search   | CVE-2026-116928                   | 9,8        | Exécution de code sans authentification, déclenchable via une pièce jointe indexée côté serveur Exchange. Correctif dans les cumulatives Windows. |
| LDAP             | CVE-2026-119958                   | 9,8        | Exécution de code sans authentification sur les contrôleurs de domaine. Exploitation jugée moins probable.                                        |
| Exchange Server  | CVE-2026-118207                   | 8,8        | Exécution de code par un compte à faibles privilèges. Correctif KB5133453, Exchange SE uniquement.                                                |
| Outlook          | CVE-2026-110043, -110068, -111309 | 8,8        | Trois exécutions de code déclenchables à l'affichage d'un e-mail piégé.                                                                           |
| Active Directory | CVE-2026-118146, -118148          | 8,8 et 7,5 | La seconde permet d'obtenir SYSTEM ; exploitation jugée plus probable.                                                                            |
| Hyper-V          | CVE-2026-113861                   | 7,5        | Évasion de machine virtuelle, parmi huit élévations de privilèges.                                                                                |

Sur un parc avec **contrôleurs de domaine et Exchange**, ces serveurs passent avant les postes. Sans serveurs sur site, les postes et les Office suffisent pour l'essentiel.

## Les mises à jour cumulatives

| Version                     | KB        |
| --------------------------- | --------- |
| Windows 11 24H2, 25H2, 26H2 | KB5132061 |
| Windows 11 23H2             | KB5131087 |
| Windows 10 21H2 / 22H2      | KB5131096 |
| Windows Server 2025         | KB5131080 |
| Windows Server 2022         | KB5131090 |
| Windows Server 2019         | KB5131085 |
| Windows Server 2016         | KB5131291 |

Deux points de calendrier : **Windows 11 23H2 Entreprise et Éducation** reçoit sa dernière mise à jour ce mois-ci ; et [la fin de support de Windows Server 2016](/blog/fin-support-windows-server-2016-janvier-2027/) approche (janvier 2027). Le blocage d'OWA et de l'envoi d'e-mails apparu après les mises à jour Windows Server d'octobre est indiqué comme **résolu** par les mises à jour du 10 novembre (KB5131080).

## Marche à suivre pour une petite structure

1. **Aujourd'hui** : pousser les mises à jour **Office / Microsoft 365 Apps** (zero-day Outlook) et les cumulatives Windows sur quelques postes pilotes.
2. **Cette semaine** : généraliser aux postes, puis aux serveurs (contrôleurs de domaine et Exchange d'abord), après sauvegarde ou point de restauration.
3. **Vérifier** après installation : numéro de build (`winver`), état des mises à jour, messagerie et OWA.
4. **Prochain rendez-vous** : le Patch Tuesday du **8 décembre 2026**.

## À retenir

- Un seul zero-day, mais exploité : **Outlook, CVE-2026-124194**, correctif via Office.
- 1 093 failles au total : ne vous fiez pas au chiffre exact, suivez les priorités.
- Serveurs d'abord s'il y a un contrôleur de domaine ou Exchange ; bloquer le SMB sortant réduit la fuite de hash.

## Sources

- [IT-Connect : Patch Tuesday de novembre 2026, récapitulatif](https://www.it-connect.fr/patch-tuesday-novembre-2026-recapitulatif/)
- [Qualys : Microsoft Patch Tuesday, November 2026 Security Update Review (en anglais)](https://blog.qualys.com/vulnerabilities-threat-research/2026/11/10/microsoft-patch-tuesday-november-2026-security-update-review)
- [Dark Reading : November Patch Tuesday, an overflowing cornucopia of CVEs (en anglais)](https://darkreading.com/vulnerabilities-threats/november-patch-tuesday-cornucopia-cves)
- [eSecurity Planet : Microsoft corrige une faille zero-day dans Outlook](https://www.esecurityplanet.com/fr/news/microsoft-corrige-une-faille-zero-day-dans-outlook-alors-que-le-patch-tuesday-de-novembre-cible-plus-de-1-000-vulnerabil/)
