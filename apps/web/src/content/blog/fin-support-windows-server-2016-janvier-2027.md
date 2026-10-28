---
title: 'Windows Server 2016 : fin du support le 12 janvier 2027'
description: 'Le support étendu de Windows Server 2016 se termine le 12 janvier 2027. Inventaire, migration vers Server 2025 ou 2022, mises à jour étendues (ESU) via Azure Arc, Active Directory et plan pour une petite structure.'
date: 2026-10-28
category: poste-de-travail
tags: ['Windows Server', 'Active Directory', 'Migration', 'ESU']
---

Selon Microsoft Learn, **le support étendu de Windows Server 2016 se termine le 12 janvier 2027**. Le support standard, lui, est terminé depuis janvier 2022. Après cette date, plus de correctifs de sécurité gratuits : un serveur 2016 continue de tourner, mais chaque faille découverte ensuite reste ouverte. À la date de cet article, il reste environ onze semaines. Voici comment s'y prendre dans une petite structure, dans le même esprit que pour [la fin de Windows 10](/blog/fin-support-windows-10-passer-a-windows-11/).

## 1. Inventorier ce qui tourne vraiment

Avant de choisir, il faut savoir ce qu'on a. Pour chaque serveur 2016, physique ou virtuel :

- les **rôles** installés (contrôleur de domaine, fichiers, impression, DHCP/DNS, IIS, Bureau à distance, WSUS...) ;
- les **applications métier** et leur éditeur (la version de Windows Server qu'il prend en charge) ;
- la **licence** : type (OEM, volume), présence ou non de Software Assurance, licences d'accès (CAL) ;
- les **dépendances** : qui se connecte à quoi, quelles sauvegardes, quel hyperviseur.

Pour lister les rôles et fonctionnalités installés :

```powershell
Get-WindowsFeature | Where-Object Installed
```

Ne pas oublier les serveurs « oubliés » : une machine virtuelle de test devenue de production, un serveur d'impression dans un coin.

## 2. Choisir la cible : Server 2025 ou 2022

Selon Microsoft Learn, le support étendu de **Windows Server 2022** va jusqu'en octobre 2031 et celui de **Windows Server 2025** jusqu'en novembre 2034. Microsoft recommande la dernière version. Quelques repères pour décider :

- **Server 2025** : la plus longue durée de vie. Vérifiez que vos applications métier sont validées par leur éditeur.
- **Server 2022** : choix prudent si un éditeur n'a pas encore validé Server 2025 ; son support étendu court jusqu'en 2031.
- Chaque version de Windows Server demande **sa propre licence**, contrairement au poste de travail.

## 3. Les options, de la meilleure à la moins bonne

**Migrer vers une version supportée.** C'est la voie normale. Deux méthodes :

- **Nouveau serveur, puis migration des rôles et des données** : le plus propre. Les outils intégrés (Windows Server Migration Tools, Storage Migration Service pour les serveurs de fichiers) y aident.
- **Mise à niveau sur place** : depuis le support d'installation, un serveur 2016 peut passer directement vers 2019, 2022 ou 2025 (Microsoft autorise jusqu'à quatre versions d'écart vers Server 2025). Sauvegarde obligatoire avant, et tous les rôles ne la supportent pas.

**Acheter des mises à jour de sécurité étendues (ESU).** Microsoft a ouvert des ESU pour Windows Server 2016 : correctifs _critiques_ et _importants_ pour une durée maximale de trois ans, jusqu'en 2030, sans nouveautés. Ce que dit la documentation Microsoft :

- Via **Azure Arc** : configuration possible dans le portail Azure depuis le 3 août 2026, **facturation à partir du 13 janvier 2027**, paiement mensuel. Il faut installer l'agent Azure Connected Machine (version 1.62 minimum) ; seules les éditions Standard et Datacenter sont prises en charge.
- **Condition de licence** : Software Assurance (contrat Enterprise Agreement, Open Value, etc.), ou licence par abonnement/SPLA. Une petite structure en licence OEM n'y a donc probablement pas droit.
- **Gratuit** pour les serveurs hébergés dans Azure (machines virtuelles Azure, Azure VMware Solution, gamme Azure Stack), selon la page ESU de Microsoft. Migrer vers Azure est donc aussi une option d'attente.
- La page Microsoft mentionne aussi un achat en licences en volume, par tranches annuelles. Les tarifs ne figurent pas dans les pages que j'ai lues : à confirmer auprès de votre revendeur.

L'ESU est une solution d'attente, pas une stratégie : elle coûte, et elle ne règle pas la dette technique.

## 4. Ce qui peut casser

**Active Directory.** C'est le point qui demande le plus de soin.

- Microsoft recommande de **ne pas mettre à niveau un contrôleur de domaine sur place**, mais d'installer de nouveaux serveurs, de les promouvoir, de déplacer les rôles FSMO, puis de rétrograder les anciens. Le schéma est préparé automatiquement à la promotion.
- Un contrôleur **Server 2025 ne fonctionne pas avec le niveau fonctionnel 2012 R2** : il faut être au moins au niveau 2016. Le niveau fonctionnel ne se relève qu'après avoir retiré les anciens contrôleurs, et on ne peut pas toujours revenir en arrière.
- La réplication de SYSVOL doit passer par **DFSR** (Windows Server 2016 est la dernière version à gérer l'ancien FRS).
- Aide-mémoire : [Active Directory](/cheatsheets/active-directory/).

**Autres rôles.** Le Print and Fax Services et AD FS ne se mettent pas à niveau sur place (migration, avec `Printbrm.exe` pour l'impression). Pour Bureau à distance, une ferme en version mixte n'est pas prise en charge, et les licences RDS sont à migrer. Vérifiez la [matrice de migration des rôles](https://learn.microsoft.com/en-us/windows-server/get-started/upgrade-migrate-roles-features).

**Applications.** Pilotes, agents de sauvegarde, antivirus, logiciels métier : testez sur une copie avant la bascule.

## 5. Plan pour une petite structure

1. Inventaire des serveurs, rôles, applications, licences.
2. Choix de la cible et vérification auprès des éditeurs.
3. Budget (licences, éventuellement matériel) et calendrier réaliste.
4. Installation du nouveau serveur à côté de l'ancien, migration des rôles, tests avec quelques utilisateurs.
5. Bascule hors horaires de travail, avec sauvegarde vérifiée.
6. Ancien serveur conservé éteint quelque temps, puis retiré.

## 6. Si la migration est impossible avant la date

Pour un serveur qui doit rester en 2016 (application figée, matériel spécifique), réduire l'exposition :

- l'isoler dans un **VLAN dédié**, avec des règles de pare-feu limitées aux flux nécessaires ;
- aucun accès Internet direct, et aucun Bureau à distance exposé ;
- droits d'administration réduits et authentification renforcée ;
- sauvegardes régulières, dont une hors ligne, et restauration testée ;
- une date de sortie écrite, pour que l'exception ne devienne pas définitive.

Pensez aussi aux **certificats Secure Boot de 2011** qui expirent cette année : les serveurs 2016 sont concernés, voir [l'article sur Secure Boot](/blog/secure-boot-certificats-2011-expiration-verifier/).

## Sources

- [Microsoft Learn : cycle de vie de Windows Server 2016](https://learn.microsoft.com/en-us/lifecycle/products/windows-server-2016)
- [Microsoft : Support for Windows Server 2016 will end in January 2027 (KB 5069229)](https://support.microsoft.com/help/5069229)
- [Microsoft Learn : cycle de vie de Windows Server 2022](https://learn.microsoft.com/en-us/lifecycle/products/windows-server-2022) et [Windows Server 2025](https://learn.microsoft.com/en-us/lifecycle/products/windows-server-2025)
- [Microsoft Learn : fournir les ESU de Windows Server via Azure Arc](https://learn.microsoft.com/en-us/azure/azure-arc/servers/prepare-extended-security-updates)
- [Microsoft : Extended Security Updates for SQL Server and Windows Server](https://www.microsoft.com/windows-server/extended-security-updates)
- [Microsoft Learn : planifier la mise à niveau de Windows Server](https://learn.microsoft.com/en-us/windows-server/get-started/install-upgrade-migrate)
- [Microsoft Learn : mise à niveau et migration des rôles et fonctionnalités](https://learn.microsoft.com/en-us/windows-server/get-started/upgrade-migrate-roles-features)
- [Microsoft Learn : mettre à niveau les contrôleurs de domaine](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/deploy/upgrade-domain-controllers)
- [Microsoft Learn : niveaux fonctionnels Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/active-directory-functional-levels)
