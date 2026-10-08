---
title: 'Fin de Windows 10 : préparer le passage à Windows 11'
description: 'Prérequis matériels, inventaire du parc, mises à jour de sécurité étendues (ESU), cycle de vie de Windows 11 et plan de migration pour une PME.'
date: 2026-10-03
category: poste-de-travail
tags: ['Windows 11', 'Windows 10']
---

Le support de **Windows 10 (version 22H2) s'est terminé le 14 octobre 2025** : Microsoft ne publie plus de correctifs de sécurité gratuits pour cette version. Un poste qui reste dessus continue de fonctionner, mais il n'est plus corrigé, ce qui pose un problème de sécurité, de conformité (assurance, cyber-assurance, audits) et de compatibilité logicielle à moyen terme. Voici comment aborder la transition dans une petite structure.

## 1. Les prérequis de Windows 11

Windows 11 impose un matériel plus récent que Windows 10 :

- Processeur 64 bits, 1 GHz ou plus, 2 cœurs ou plus, **dans la liste des processeurs compatibles** (en pratique, Intel à partir de la 8e génération et AMD Ryzen à partir de la série 2000, avec des exceptions).
- **TPM 2.0** (module de plateforme sécurisée).
- Démarrage **UEFI** avec **Secure Boot** disponible.
- 4 Go de RAM et 64 Go de stockage au minimum.

Les deux points qui bloquent le plus souvent : un **processeur trop ancien**, et un **TPM ou Secure Boot désactivé** dans le BIOS (dans ce cas, c'est simplement un réglage).

## 2. Inventorier le parc

On ne planifie pas sans connaître l'existant. Pour chaque poste, relever : modèle, âge, processeur, RAM, stockage, version et édition de Windows, et utilisateur. Les solutions de gestion de parc ou d'administration des postes (Intune, un outil d'inventaire) le font automatiquement. À défaut, un script PowerShell suffit pour un petit parc :

```powershell
Get-Tpm | Select-Object TpmPresent, TpmReady
Confirm-SecureBootUEFI
Get-CimInstance Win32_Processor | Select-Object Name
Get-CimInstance Win32_ComputerSystem | Select-Object Model, TotalPhysicalMemory
```

L'application **Bilan de santé du PC** de Microsoft donne aussi un verdict de compatibilité poste par poste.

## 3. Classer les postes en trois catégories

1. **Compatibles et à jour** : mise à niveau en place possible.
2. **Compatibles après réglage** : TPM ou Secure Boot à activer dans le BIOS, mise à jour du firmware.
3. **Non compatibles** : remplacement à budgéter, par ordre de priorité (postes les plus exposés, les plus anciens, les plus critiques).

## 4. Si un poste ne peut pas migrer tout de suite

Microsoft propose des **mises à jour de sécurité étendues (ESU)** pour Windows 10 version 22H2. Elles ne contiennent que des correctifs de sécurité critiques et importants, sans nouveautés ni support général.

- **Entreprises et organismes de formation** : jusqu'à **3 ans** de couverture, soit jusqu'en octobre 2028. Le tarif annoncé est de **61 $ par appareil la première année, puis il double chaque année** (122 $, puis 244 $). L'ESU est incluse sans surcoût pour les postes Windows 10 hébergés sur Windows 365 ou Azure Virtual Desktop.
- **Particuliers** : une seule année, qui se termine le **13 octobre 2026**. Dans l'Espace économique européen (France comprise), l'inscription est gratuite avec un compte Microsoft. Ailleurs, elle passe par la sauvegarde Windows, 1 000 points Microsoft Rewards ou un paiement de 30 $.

Les montants et conditions peuvent évoluer : vérifiez la **page officielle de Microsoft** avant de décider. L'ESU est une solution d'attente, pas une stratégie : elle coûte, et son prix double chaque année pour les entreprises.

Pour un poste qui doit absolument rester sur Windows 10 (logiciel métier ou matériel spécifique), l'isoler : pas d'accès Internet direct si possible, segmentation réseau, droits utilisateurs limités, sauvegardes régulières.

## 5. Tester les applications

Avant le déploiement général, valider sur un **groupe pilote** représentatif (un poste par service ou type d'usage) :

- Les logiciels métiers, les pilotes (imprimantes, scanners, périphériques spécifiques).
- Les connexions aux serveurs, VPN, partages réseau.
- Les extensions de messagerie et les macros Office.

La grande majorité des applications qui fonctionnent sous Windows 10 fonctionnent sous Windows 11. Les problèmes viennent surtout de vieux pilotes et d'applications très anciennes.

## 6. Déployer

- **Mise à niveau en place** pour les postes compatibles : les données et applications sont conservées. Faites des **sauvegardes** avant.
- **Réinstallation propre** pour les nouveaux postes ou ceux à remettre à plat. Un outil de déploiement moderne (Autopilot avec Intune, par exemple) permet de préparer un poste sans intervention manuelle. Microsoft Deployment Toolkit (MDT), longtemps utilisé, a été officiellement retiré par Microsoft en janvier 2026 (plus de mises à jour, de correctifs de sécurité ni de support) : si vous l'utilisez encore, prévoyez d'en sortir.
- Procéder **par vagues** : pilote, puis un service à la fois, avec un créneau de support dédié.
- Prévoir la **communication** : ce qui change dans l'interface (menu Démarrer, barre des tâches, paramètres), et à qui s'adresser.

## 7. Comprendre le cycle de vie de Windows 11 lui-même

Windows 11 aussi a une fin de support, **par version**. Chaque mise à jour annuelle est supportée pendant une durée limitée : en règle générale **24 mois pour les éditions Famille et Pro, 36 mois pour Entreprise et Éducation**. Rester sur une version ancienne finit donc par exposer au même problème que Windows 10.

Deux dates à retenir pour les éditions Famille et Pro :

- **Windows 11 24H2** : fin de support le **13 octobre 2026**.
- **Windows 11 25H2** : fin de support le **12 octobre 2027**.

Les éditions Entreprise et Éducation bénéficient de 12 mois supplémentaires. Vérifiez les dates exactes de votre version sur la page « cycle de vie » de Microsoft, et mettez en place des anneaux de mise à jour (un petit groupe d'abord, puis le reste du parc).

## Plan type pour une PME

1. Inventaire complet du parc.
2. Classement : compatibles, à régler, à remplacer.
3. Budget de renouvellement et calendrier.
4. Pilote sur un petit groupe.
5. Déploiement par vagues.
6. Mise en place d'un suivi du cycle de vie des versions de Windows.

Le plus tôt est le mieux : une migration planifiée coûte presque toujours moins cher qu'une migration en urgence.

## Sources

- [Microsoft : cycle de vie de Windows 10 Famille et Pro](https://learn.microsoft.com/en-us/lifecycle/products/windows-10-home-and-pro) (fin de support le 14 octobre 2025)
- [Microsoft : cycle de vie de Windows 11 Famille et Pro](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro)
- [Microsoft : configuration requise de Windows 11](https://www.microsoft.com/fr-fr/windows/windows-11-specifications)
- [Petri : fin de support de Microsoft Deployment Toolkit](https://petri.com/microsoft-deployment-toolkit-end-of-support/)
- [Redmond Magazine : tarifs des mises à jour de sécurité étendues (ESU) pour Windows 10](https://redmondmag.com/articles/2024/04/04/microsoft-reveals-pricing-for-windows-10-extended-security-updates.aspx)
